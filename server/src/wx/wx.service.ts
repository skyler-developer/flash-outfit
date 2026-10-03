import { Injectable } from '@nestjs/common';
import { appConfig } from '../common/config';

export type SecSuggest = 'pass' | 'review' | 'risky';

/** 微信接口通用返回结构 */
interface WxResp {
  errcode?: number;
  errmsg?: string;
}

interface MsgSecCheckResp extends WxResp {
  result?: { suggest?: SecSuggest; label?: number };
}

interface MediaCheckAsyncResp extends WxResp {
  /** 异步审核回执，用于回调对账 */
  trace_id?: string;
}

interface StableTokenResp extends WxResp {
  access_token?: string;
  expires_in?: number;
}

/**
 * 微信内容安全接口封装：
 * - stable_token 获取与内存缓存（提前 5 分钟刷新，单飞防并发）
 * - msgSecCheck v2：文本同步审核
 * - mediaCheckAsync：图片异步审核（结果经消息推送回调）
 *
 * 降级策略（均为 fail-open，保证开发/接口故障不阻断业务）：
 * - 未配置 WX_APPID/WX_SECRET（开发 mock 模式）→ 直接放行
 * - mock 用户（openid 以 mock: 开头，非真实 openid）→ 直接放行
 * - 微信接口网络/业务错误 → 告警日志 + 放行
 *   如需更严格的 fail-closed（审核服务不可用时拒绝发布），把对应分支改为抛 CONTENT_RISK 即可
 */
@Injectable()
export class WxService {
  private token: { value: string; expiresAt: number } | null = null;
  private tokenPromise: Promise<string> | null = null;

  get configured(): boolean {
    return Boolean(appConfig.wx.appid && appConfig.wx.secret);
  }

  private shouldSkip(openid: string): boolean {
    return !this.configured || !openid || openid.startsWith('mock:');
  }

  /** stable_token：单飞缓存，避免并发刷新覆盖 */
  private async getAccessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;
    if (!this.tokenPromise) {
      this.tokenPromise = this.requestToken().finally(() => {
        this.tokenPromise = null;
      });
    }
    return this.tokenPromise;
  }

  private async requestToken(): Promise<string> {
    const res = await fetch('https://api.weixin.qq.com/cgi-bin/stable_token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credential',
        appid: appConfig.wx.appid,
        secret: appConfig.wx.secret,
      }),
    });
    const data = (await res.json()) as StableTokenResp;
    if (!data.access_token) {
      throw new Error(`[wx] stable_token 获取失败: ${data.errcode} ${data.errmsg}`);
    }
    const ttl = Math.max(0, (data.expires_in ?? 7200) - 300);
    this.token = { value: data.access_token, expiresAt: Date.now() + ttl * 1000 };
    return data.access_token;
  }

  private async postWx<T extends WxResp>(path: string, body: object): Promise<T> {
    const token = await this.getAccessToken();
    const res = await fetch(`https://api.weixin.qq.com${path}?access_token=${token}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await res.json()) as T;
  }

  /**
   * msgSecCheck v2（同步文本审核）。
   * @param scene 1=资料 2=评论 3=论坛（按契约：发布描述=3，申请留言=2）
   * @returns suggest；异常/未配置时返回 'pass'（fail-open）
   */
  async checkText(content: string, openid: string, scene: 1 | 2 | 3 = 3): Promise<SecSuggest> {
    if (this.shouldSkip(openid) || !content?.trim()) return 'pass';
    try {
      const data = await this.postWx<MsgSecCheckResp>('/wxa/msg_sec_check', {
        content,
        openid,
        scene,
        version: 2,
      });
      if (data.errcode) {
        console.warn(`[wx] msgSecCheck errcode=${data.errcode} ${data.errmsg}，放行`);
        return 'pass';
      }
      return data.result?.suggest ?? 'pass';
    } catch (e) {
      console.warn('[wx] msgSecCheck 网络异常，放行：', e);
      return 'pass';
    }
  }

  /**
   * mediaCheckAsync（图片异步审核）。
   * 注意：media_url 必须是微信服务器可公网访问的地址（PUBLIC_BASE_URL 需为线上域名）。
   * @returns trace_id；跳过/失败时返回 null
   */
  async submitMediaCheck(mediaUrl: string, openid: string, scene: 1 | 2 | 3 = 3): Promise<string | null> {
    if (this.shouldSkip(openid)) return null;
    try {
      const data = await this.postWx<MediaCheckAsyncResp>('/wxa/media_check_async', {
        media_url: mediaUrl,
        media_type: 2, // 2=图片
        version: 2,
        openid,
        scene,
      });
      if (data.errcode || !data.trace_id) {
        console.warn(`[wx] mediaCheckAsync errcode=${data.errcode} ${data.errmsg}`);
        return null;
      }
      return data.trace_id;
    } catch (e) {
      console.warn('[wx] mediaCheckAsync 网络异常：', e);
      return null;
    }
  }
}
