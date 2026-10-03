import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Like, Repository } from 'typeorm';
import { MediaCheck } from './media-check.entity';
import { ActivityRequest, ReviewStatus } from '../entities/request.entity';
import { WxService } from './wx.service';
import { NotificationsService } from '../notifications/notifications.service';

/** 审核中超过该时限仍未收到回调的图片，视为审核服务不可用，自动放行（fail-open） */
const CHECK_TIMEOUT_MS = 10 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class MediaCheckService {
  private sweepTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectRepository(MediaCheck)
    private repo: Repository<MediaCheck>,
    @InjectRepository(ActivityRequest)
    private requestsRepo: Repository<ActivityRequest>,
    private wx: WxService,
    private notifications: NotificationsService,
  ) {
    // 启动 5 秒后扫一次（治愈重启前遗留的 checking），之后每 5 分钟定期扫描
    const startup = setTimeout(() => {
      this.sweepStaleChecks().catch(() => {});
      this.sweepTimer = setInterval(
        () => this.sweepStaleChecks().catch(() => {}),
        SWEEP_INTERVAL_MS,
      );
    }, 5_000);
    startup.unref?.();
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  /**
   * 兜底 sweep：checking 超过 10 分钟仍未收到微信回调的图片自动置 pass 并重算请求状态。
   * 场景：回调丢失（消息推送未配置/推送失败/服务重启错过）、本地开发无公网回调地址。
   * 与文档的 fail-open 策略一致：审核服务不可用时不阻断业务内容展示。
   */
  private async sweepStaleChecks(): Promise<void> {
    const stale = await this.repo.find({
      where: { status: 'checking', createdAt: LessThan(new Date(Date.now() - CHECK_TIMEOUT_MS)) },
    });
    if (!stale.length) return;
    const urls = stale.map((s) => s.mediaUrl);
    console.warn(`[wx] ${urls.length} 条图片审核超过 ${CHECK_TIMEOUT_MS / 60000} 分钟未收到回调，自动放行:`, urls);
    await this.repo.update(
      { id: In(stale.map((s) => s.id)) },
      { status: 'pass', checkedAt: new Date() },
    );
    await this.recomputeRequestsByUrls(urls);
  }

  /**
   * 发布/修改请求时：为尚未送审过的图片发起异步审核（同一 URL 只送审一次），
   * 完成后重算受影响请求的 reviewStatus。
   * 未配置微信（开发 mock 模式）直接落 pass 记录 → 请求立即可见，保持本地开发体验。
   */
  async submitForPhotos(photos: string[], openid: string): Promise<void> {
    if (!photos?.length) return;
    const existing = await this.repo.find({ where: { mediaUrl: In(photos) } });
    const seen = new Set(existing.map((m) => m.mediaUrl));
    const pending = [...new Set(photos)].filter((u) => !seen.has(u));

    if (pending.length) {
      const skip = !this.wx.configured; // 开发模式：无 appid/secret，不真实送审
      await Promise.all(
        pending.map(async (url) => {
          const traceId = skip ? null : await this.wx.submitMediaCheck(url, openid);
          await this.repo.save(
            this.repo.create({ mediaUrl: url, traceId, status: skip ? 'pass' : 'checking' }),
          );
        }),
      );
    }

    await this.recomputeRequestsByUrls([...new Set(photos)]);
  }

  /** 返回给定 URL 中处于 risky 状态的集合（展示侧屏蔽用） */
  async riskyUrlSet(urls: string[]): Promise<Set<string>> {
    if (!urls?.length) return new Set();
    const rows = await this.repo.find({ where: { mediaUrl: In(urls), status: 'risky' } });
    return new Set(rows.map((r) => r.mediaUrl));
  }

  /** 列表封面：第一张未违规图片，全违规返回 null */
  async pickCover(photos: string[] | null | undefined): Promise<string | null> {
    if (!photos?.length) return null;
    const risky = await this.riskyUrlSet(photos);
    return photos.find((u) => !risky.has(u)) ?? null;
  }

  /**
   * 微信回调事件 wxa_media_check：trace_id 对账回写终态。
   * 幂等：已回写过终态的记录直接跳过（微信 5 秒未收到 success 会重试推送）。
   */
  async handleCallback(payload: { trace_id: string; result?: { suggest?: string; label?: number } }): Promise<void> {
    const rec = await this.repo.findOneBy({ traceId: payload.trace_id });
    if (!rec) {
      console.warn(`[wx] 回调 trace_id=${payload.trace_id} 无对应送审记录`);
      return;
    }
    if (rec.status !== 'checking') return;

    const suggest = payload.result?.suggest;
    const status: MediaCheck['status'] = suggest === 'risky' ? 'risky' : suggest === 'pass' ? 'pass' : 'checking';
    await this.repo.update(rec.id, {
      status,
      label: payload.result?.label ?? null,
      checkedAt: new Date(),
    });
    if (status !== 'checking') {
      await this.recomputeRequestsByUrls([rec.mediaUrl]);
    }
  }

  /**
   * 重算包含任一 URL 的请求的 reviewStatus：
   * - 任一当前图片记录 risky → rejected（通知发布者）
   * - 存在 checking 记录 → checking
   * - 其余（全部 pass / 无记录的存量图片）→ pass，首页恢复展示
   * 只按请求当前 photos 数组计算：移除违规图后重算即可恢复 pass。
   */
  async recomputeRequestsByUrls(urls: string[]): Promise<void> {
    if (!urls?.length) return;
    // photos 为 simple-json（文本列），LIKE 匹配 URL 子串
    const requests = await this.requestsRepo.find({
      where: urls.map((u) => ({ photos: Like(`%${u}%`) })) as any,
    });
    for (const r of requests) {
      if (!r.photos?.length) continue;
      const rows = await this.repo.find({ where: { mediaUrl: In(r.photos) } });
      const byUrl = new Map(rows.map((x) => [x.mediaUrl, x.status]));

      let next: ReviewStatus = 'pass';
      for (const u of r.photos) {
        const s = byUrl.get(u) ?? 'pass'; // 无送审记录（存量/种子图）视为通过
        if (s === 'risky') {
          next = 'rejected';
          break;
        }
        if (s === 'checking') next = 'checking';
      }

      if (r.reviewStatus !== next) {
        await this.requestsRepo.update(r.id, { reviewStatus: next });
        if (next === 'rejected') {
          await this.notifications.push(
            r.publisherId,
            'contentBlocked',
            r.id,
            `你发布的「${r.destination.slice(0, 10)}」未通过内容安全审核，已在首页隐藏，请更换图片后重新提交`,
          );
        }
      }
    }
  }
}
