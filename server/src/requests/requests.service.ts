import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ActivityRequest } from '../entities/request.entity';
import { User, calcAge } from '../entities/user.entity';
import { Application } from '../entities/application.entity';
import { ErrorCode, err } from '../common/errors';
import { haversineKm } from '../common/haversine';
import { checkPreference, containsSensitive, truncate } from '../common/applicability';
import { CreateRequestDto, ListRequestsDto, UpdateRequestDto } from './requests.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { WxService } from '../wx/wx.service';
import { MediaCheckService } from '../wx/media-check.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(ActivityRequest)
    private requestsRepo: Repository<ActivityRequest>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Application)
    private appsRepo: Repository<Application>,
    private notifications: NotificationsService,
    private wx: WxService,
    private mediaChecks: MediaCheckService,
  ) {}

  /** 请求流：只返回 recruiting，支持类型/时间/距离/城市过滤 + 距离或时间排序 */
  async list(viewerId: number, q: ListRequestsDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;
    const onlyApplicable = q.onlyApplicable === 'true' || q.onlyApplicable === true;

    const viewer = await this.usersRepo.findOneBy({ id: viewerId });
    const now = Date.now();

    // 1. 取招募中且审核通过的请求（粗筛，页码放大以支撑距离排序后分页）
    const fetchSize = 200;
    const [items] = await this.requestsRepo.findAndCount({
      where: { status: 'recruiting', reviewStatus: 'pass' },
      order: { id: 'DESC' },
      take: fetchSize,
    });

    // 2. 时间范围过滤
    let list = items.filter((r) => {
      const t = new Date(r.activityTime).getTime();
      if (t <= now) return false; // 过期不进流
      switch (q.timeRange) {
        case 'weekend': {
          const d = new Date(r.activityTime);
          const day = d.getDay();
          return day === 0 || day === 6;
        }
        case 'd7':
          return t <= now + 7 * 86400_000;
        case 'd30':
          return t <= now + 30 * 86400_000;
        default:
          return true;
      }
    });

    // 3. 类型过滤
    if (q.type) {
      list = list.filter((r) => r.type === q.type);
    }

    // 4. 城市过滤（降级模式）
    if (q.city) {
      list = list.filter((r) => r.city === q.city);
    }

    // 5. 只看可申请（双向偏好匹配）
    if (onlyApplicable && viewer) {
      const viewerAge = viewer.birthYear ? calcAge(viewer.birthYear) : null;
      list = list.filter((r) => {
        if (r.publisherId === viewer.id) return false;
        if (r.genderPreference !== 'all' && r.genderPreference !== viewer.gender) return false;
        if (viewerAge !== null && (viewerAge < r.ageMin || viewerAge > r.ageMax)) return false;
        return true;
      });
    }

    // 6. 我的申请状态（卡片角标）
    const myApps = list.length
      ? await this.appsRepo.find({ where: { applicantId: viewerId, requestId: In(list.map((r) => r.id)) } })
      : [];
    const myAppMap = new Map(myApps.map((a) => [a.requestId, a.status]));

    // 7. 距离计算
    const withDistance = list.map((r) => ({
      r,
      distanceKm:
        q.lat != null && q.lng != null && r.lat != null && r.lng != null
          ? haversineKm(q.lat, q.lng, r.lat, r.lng)
          : null,
    }));

    // 8. 排序：sortBy=distance 需坐标；降级/无坐标按 activityTime 正序（最近的活动在前）
    if (q.sortBy === 'distance' && q.lat != null && q.lng != null) {
      withDistance.sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else {
      withDistance.sort(
        (a, b) => new Date(a.r.activityTime).getTime() - new Date(b.r.activityTime).getTime(),
      );
    }

    // 9. 距离范围过滤（排序后过滤，避免先过滤丢远距离排序页）
    if (q.distance != null) {
      const filtered = withDistance.filter(
        (x) => x.distanceKm != null && x.distanceKm <= q.distance,
      );
      return this.buildListPage(filtered, page, pageSize);
    }

    return this.buildListPage(withDistance, page, pageSize);
  }

  private async buildListPage(
    items: { r: ActivityRequest; distanceKm: number | null }[],
    page: number,
    pageSize: number,
  ) {
    const total = items.length;
    const slice = items.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    const publisherIds = [...new Set(slice.map((x) => x.r.publisherId))];
    const publishers = publisherIds.length
      ? await this.usersRepo.find({ where: { id: In(publisherIds) } })
      : [];
    const publisherMap = new Map(publishers.map((u) => [u.id, u]));

    return {
      list: await Promise.all(
        slice.map(async ({ r, distanceKm }) => {
          const p = publisherMap.get(r.publisherId);
          return {
            id: r.id,
            type: r.type,
            activityTime: r.activityTime,
            destination: r.destination,
            city: r.city,
            genderPreference: r.genderPreference,
            ageRange: [r.ageMin, r.ageMax],
            descriptionSummary: r.description.slice(0, 50),
            coverImage: await this.mediaChecks.pickCover(r.photos),
            distanceKm,
            expired: new Date(r.activityTime).getTime() <= Date.now(),
            status: r.status,
            approvedCount: 0, // 列表流场景不需要，详情单独查
            maxMembers: r.maxMembers,
            publisher: p
              ? { id: p.id, nickname: p.nickname, avatar: p.avatar }
              : null,
          };
        }),
      ),
      total,
      page,
      pageSize,
    };
  }

  /** 请求详情：审核未通过的请求仅发布者本人可见 */
  async detail(viewerId: number, id: number) {
    const request = await this.requestsRepo.findOneBy({ id });
    if (!request) throw new NotFoundException();
    if (request.reviewStatus !== 'pass' && request.publisherId !== viewerId) {
      throw new NotFoundException();
    }

    const viewer = await this.usersRepo.findOneBy({ id: viewerId });
    const publisher = await this.usersRepo.findOneBy({ id: request.publisherId });

    const approvedCount = await this.appsRepo.count({
      where: { requestId: id, status: 'approved' },
    });
    const pendingCount = await this.appsRepo.count({
      where: { requestId: id, status: 'pending' },
    });
    const myApp = await this.appsRepo.findOne({
      where: { requestId: id, applicantId: viewerId },
      order: { id: 'DESC' },
    });

    let applicable = false;
    let applicableReason: string | null = null;
    if (viewer) {
      const pref = checkPreference(viewer, request);
      if (!pref.applicable) {
        applicable = false;
        applicableReason = pref.reason;
      } else {
        // 静态偏好通过后，再校验满员与重复申请
        const approvedCount0 = await this.appsRepo.count({
          where: { requestId: id, status: 'approved' },
        });
        if (approvedCount0 >= request.maxMembers) {
          applicable = false;
          applicableReason = '该请求已满员';
        } else {
          const mine = await this.appsRepo.findOne({
            where: { requestId: id, applicantId: viewerId },
            order: { id: 'DESC' },
          });
          if (mine && mine.status !== 'rejected') {
            applicable = false;
            applicableReason = mine.status === 'pending' ? '已申请，等待审批' : '已成功加入';
          } else {
            applicable = true;
          }
        }
      }
    }

    return {
      id: request.id,
      type: request.type,
      activityTime: request.activityTime,
      destination: request.destination,
      location: { lat: request.lat, lng: request.lng, city: request.city },
      genderPreference: request.genderPreference,
      ageRange: [request.ageMin, request.ageMax],
      description: request.description,
      // 先审后展：违规图保留原图返回，标记在 riskyPhotoUrls，前端叠“未通过审核”角标
      photos: request.photos || [],
      riskyPhotoUrls: [...(await this.mediaChecks.riskyUrlSet(request.photos || []))],
      maxMembers: request.maxMembers,
      autoCloseOnGrouped: request.autoCloseOnGrouped,
      approvedCount,
      pendingCount,
      status: request.status,
      reviewStatus: request.reviewStatus,
      expired: new Date(request.activityTime).getTime() <= Date.now(),
      isPublisher: request.publisherId === viewerId,
      applicable,
      applicableReason,
      myApplicationStatus: myApp ? myApp.status : null,
      publisher: publisher
        ? {
            id: publisher.id,
            nickname: publisher.nickname,
            publisherGender: publisher.gender,
            avatar: publisher.avatar,
            gender: publisher.gender,
            age: publisher.birthYear ? calcAge(publisher.birthYear) : null,
            interests: publisher.interests || [],
          }
        : null,
    };
  }

  /** 发布请求 */
  async create(userId: number, dto: CreateRequestDto) {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException();

    // 契约校验：发布者必须已填微信号
    if (!user.wechatId) throw err(ErrorCode.NO_WECHAT_ID);
    if (new Date(dto.activityTime).getTime() <= Date.now()) throw err(ErrorCode.TIME_PAST);
    if (!Array.isArray(dto.photos) || dto.photos.length < 1 || dto.photos.length > 6) {
      throw err(ErrorCode.PHOTO_INVALID, '需上传 1~6 张照片');
    }
    if (containsSensitive(dto.description)) throw err(ErrorCode.CONTENT_RISK);

    // 微信 msgSecCheck v2 同步文本审核（scene=3 论坛；未配置/异常时 fail-open 放行）
    const suggest = await this.wx.checkText(dto.description, user.openid, 3);
    if (suggest === 'risky') throw err(ErrorCode.CONTENT_RISK);

    const [ageMin, ageMax] = dto.ageRange;
    const entity = await this.requestsRepo.save(
      this.requestsRepo.create({
        publisherId: userId,
        type: dto.type,
        activityTime: dto.activityTime,
        destination: dto.destination.trim(),
        lat: dto.location.lat,
        lng: dto.location.lng,
        city: dto.location.city,
        genderPreference: dto.genderPreference,
        ageMin,
        ageMax,
        description: dto.description,
        photos: dto.photos,
        maxMembers: dto.maxMembers ?? 1,
        autoCloseOnGrouped: dto.autoCloseOnGrouped ?? false,
        status: 'recruiting',
        // 图片异步审核中（开发 mock 模式下 submitForPhotos 重算后会立即置 pass）
        reviewStatus: 'checking',
      }),
    );
    // 先送审重算状态（决定首页可见性），再返回详情
    await this.mediaChecks.submitForPhotos(dto.photos, user.openid);
    return this.detail(userId, entity.id);
  }

  /** 修改请求（仅发布者） */
  async update(userId: number, id: number, dto: UpdateRequestDto) {
    const request = await this.requestsRepo.findOneBy({ id });
    if (!request) throw new NotFoundException();
    if (request.publisherId !== userId) throw err(ErrorCode.NOT_PUBLISHER);

    if (dto.activityTime !== undefined && new Date(dto.activityTime).getTime() <= Date.now()) {
      throw err(ErrorCode.TIME_PAST);
    }
    if (dto.description !== undefined && containsSensitive(dto.description)) {
      throw err(ErrorCode.CONTENT_RISK);
    }

    // 文案变更时同步送审 msgSecCheck
    if (dto.description !== undefined) {
      const user = await this.usersRepo.findOneBy({ id: userId });
      if (user) {
        const suggest = await this.wx.checkText(dto.description, user.openid, 3);
        if (suggest === 'risky') throw err(ErrorCode.CONTENT_RISK);
      }
    }

    const patch: Partial<ActivityRequest> = {};
    if (dto.type) patch.type = dto.type;
    if (dto.activityTime) patch.activityTime = dto.activityTime;
    if (dto.destination) patch.destination = dto.destination.trim();
    if (dto.location) {
      patch.lat = dto.location.lat;
      patch.lng = dto.location.lng;
      patch.city = dto.location.city;
    }
    if (dto.genderPreference) patch.genderPreference = dto.genderPreference;
    if (dto.ageRange) {
      patch.ageMin = dto.ageRange[0];
      patch.ageMax = dto.ageRange[1];
    }
    if (dto.description) patch.description = dto.description;
    if (dto.photos) {
      if (dto.photos.length < 1 || dto.photos.length > 6) {
        throw err(ErrorCode.PHOTO_INVALID, '需上传 1~6 张照片');
      }
      patch.photos = dto.photos;
    }
    if (dto.maxMembers !== undefined) patch.maxMembers = dto.maxMembers;
    if (dto.autoCloseOnGrouped !== undefined) patch.autoCloseOnGrouped = dto.autoCloseOnGrouped;
    if (dto.status === 'finished') patch.status = 'finished';

    await this.requestsRepo.update(id, patch);

    // 图片变更：新图送审并按当前 photos 重算 reviewStatus
    // （移除违规图 → 重算可恢复 pass；新增图片 → 回到 checking 待回调）
    if (dto.photos) {
      const user = await this.usersRepo.findOneBy({ id: userId });
      if (user) await this.mediaChecks.submitForPhotos(dto.photos, user.openid);
    }
    return this.detail(userId, id);
  }

  /** 删除请求：通知全部申请人（含已成组），终止微信号交换关系 */
  async remove(userId: number, id: number) {
    const request = await this.requestsRepo.findOneBy({ id });
    if (!request) throw new NotFoundException();
    if (request.publisherId !== userId) throw err(ErrorCode.NOT_PUBLISHER);

    const apps = await this.appsRepo.find({ where: { requestId: id } });
    const user = await this.usersRepo.findOneBy({ id: userId });
    for (const app of apps) {
      await this.notifications.push(
        app.applicantId,
        'requestClosed',
        id,
        `「${truncate(request.destination, 10)}」的发布者已删除该请求`,
      );
    }

    await this.requestsRepo.delete(id);
    return null;
  }

  /** 我发布的请求列表（含统计） */
  async myPublished(userId: number, page = 1, pageSize = 10) {
    const [items, total] = await this.requestsRepo.findAndCount({
      where: { publisherId: userId },
      order: { id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const list = [];
    for (const r of items) {
      const approvedCount = await this.appsRepo.count({
        where: { requestId: r.id, status: 'approved' },
      });
      const pendingCount = await this.appsRepo.count({
        where: { requestId: r.id, status: 'pending' },
      });
      list.push({
        id: r.id,
        status: r.status,
        reviewStatus: r.reviewStatus,
        expired: new Date(r.activityTime).getTime() <= Date.now(),
        approvedCount,
        pendingCount,
        coverImage: await this.mediaChecks.pickCover(r.photos),
        activityTime: r.activityTime,
        destination: r.destination,
        type: r.type,
        maxMembers: r.maxMembers,
      });
    }
    return { list, total, page, pageSize };
  }
}
