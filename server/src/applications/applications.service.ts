import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Application } from '../entities/application.entity';
import { ActivityRequest } from '../entities/request.entity';
import { User, calcAge } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WxService } from '../wx/wx.service';
import { ErrorCode, err } from '../common/errors';
import { containsSensitive, truncate } from '../common/applicability';
import { CreateApplicationDto } from './applications.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private appsRepo: Repository<Application>,
    @InjectRepository(ActivityRequest)
    private requestsRepo: Repository<ActivityRequest>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private notifications: NotificationsService,
    private wx: WxService,
    private dataSource: DataSource,
  ) {}

  /** 申请加入：按契约顺序校验，首个失败返回对应错误码 */
  async apply(userId: number, requestId: number, dto: CreateApplicationDto) {
    const user = await this.usersRepo.findOneBy({ id: userId });
    const request = await this.requestsRepo.findOneBy({ id: requestId });
    if (!user || !request) throw new NotFoundException();

    // 1. 重新校验活动状态及发布者；过期、偏好和名额不限制提交。
    if (request.status !== 'recruiting') throw err(ErrorCode.NOT_APPLICABLE, '该请求已结束');
    if (request.reviewStatus !== 'pass') throw err(ErrorCode.NOT_APPLICABLE, '该请求尚未通过审核');
    if (request.publisherId === userId) throw err(ErrorCode.NOT_APPLICABLE, '不能申请自己发布的请求');
    // 2. 未重复申请
    const mine = await this.appsRepo.findOne({
      where: { requestId, applicantId: userId },
      order: { id: 'DESC' },
    });
    if (mine && mine.status !== 'rejected') throw err(ErrorCode.DUPLICATE_APPLY);

    // 3. 留言内容安全：本地敏感词 + 微信 msgSecCheck v2（scene=2 评论）
    if (containsSensitive(dto.message)) throw err(ErrorCode.CONTENT_RISK);
    const suggest = await this.wx.checkText(dto.message, user.openid, 2);
    if (suggest === 'risky') throw err(ErrorCode.CONTENT_RISK);

    const app = await this.appsRepo.save(
      this.appsRepo.create({
        requestId,
        applicantId: userId,
        message: dto.message.trim(),
        status: 'pending',
      }),
    );
    await this.notifications.push(
      request.publisherId,
      'newApply',
      app.id,
      `${user.nickname || '有人'} 申请加入你的「${truncate(request.destination, 10)}」`,
    );
    return { id: app.id, status: app.status, createdAt: app.createdAt };
  }

  /** 某请求的申请列表（仅发布者） */
  async listByRequest(publisherId: number, requestId: number, status?: string, page = 1, pageSize = 10) {
    const request = await this.requestsRepo.findOneBy({ id: requestId });
    if (!request) throw new NotFoundException();
    if (request.publisherId !== publisherId) throw err(ErrorCode.NOT_PUBLISHER);

    const where: Record<string, unknown> = { requestId };
    if (status) where.status = status;

    const [items, total] = await this.appsRepo.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const list = [];
    for (const app of items) {
      const applicant = await this.usersRepo.findOneBy({ id: app.applicantId });
      list.push({
        id: app.id,
        applicant: {
          id: applicant.id,
          nickname: applicant.nickname,
          avatar: applicant.avatar,
          gender: applicant.gender,
          age: applicant.birthYear ? calcAge(applicant.birthYear) : null,
          interests: applicant.interests || [],
          // 契约：仅 approved 才披露微信号
          wechatId: app.status === 'approved' ? applicant.wechatId : null,
        },
        message: app.message,
        status: app.status,
        createdAt: app.createdAt,
      });
    }
    return { list, total, page, pageSize };
  }

  /** 审批：事务内完成满员校验→状态更新→计数→autoClose→通知 */
  async review(userId: number, applicationId: number, action: 'approve' | 'reject') {
    return this.dataSource.transaction(async (em) => {
      const app = await em.findOne(Application, { where: { id: applicationId } });
      if (!app) throw new NotFoundException();
      const request = await em.findOne(ActivityRequest, { where: { id: app.requestId } });
      if (!request) throw new NotFoundException();
      if (request.publisherId !== userId) throw err(ErrorCode.NOT_PUBLISHER);
      if (app.status !== 'pending') throw err(ErrorCode.ALREADY_HANDLED);

      if (action === 'reject') {
        await em.update(Application, applicationId, { status: 'rejected', handledAt: new Date().toISOString() });
        const applicant = await em.findOne(User, { where: { id: app.applicantId } });
        await this.notifications.push(
          app.applicantId,
          'applyRejected',
          applicationId,
          `你的申请「${truncate(request.destination, 10)}」未通过`,
        );
        return {
          id: applicationId,
          status: 'rejected' as const,
          applicantWechatNote: applicant?.nickname,
        };
      }

      // approve：事务内校验满员，防并发超额成组
      const approvedCount = await em.count(Application, {
        where: { requestId: request.id, status: 'approved' },
      });
      if (approvedCount >= request.maxMembers) throw err(ErrorCode.FULL);

      await em.update(Application, applicationId, {
        status: 'approved',
        handledAt: new Date().toISOString(),
      });

      // autoCloseOnGrouped：首个 approve 后请求自动 grouped
      if (request.autoCloseOnGrouped && request.status === 'recruiting') {
        await em.update(ActivityRequest, request.id, { status: 'grouped' });
      }

      const applicant = await em.findOne(User, { where: { id: app.applicantId } });
      await this.notifications.push(
        app.applicantId,
        'applyApproved',
        applicationId,
        `你的申请「${truncate(request.destination, 10)}」已通过`,
      );

      return {
        id: applicationId,
        status: 'approved' as const,
        // 发布者审批通过后立即可见申请人微信号
        applicantWechatId: applicant?.wechatId,
      };
    });
  }

  /** 我的申请列表（approved 时返回发布者微信号） */
  async myApplications(userId: number, page = 1, pageSize = 10) {
    const [items, total] = await this.appsRepo.findAndCount({
      where: { applicantId: userId },
      order: { id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const list = [];
    for (const app of items) {
      const request = await this.requestsRepo.findOneBy({ id: app.requestId });
      const publisher = request
        ? await this.usersRepo.findOneBy({ id: request.publisherId })
        : null;
      list.push({
        id: app.id,
        status: app.status,
        message: app.message,
        createdAt: app.createdAt,
        request: request
          ? {
              id: request.id,
              type: request.type,
              activityTime: request.activityTime,
              destination: request.destination,
              coverImage: request.photos?.[0] || null,
              status: request.status,
              expired: new Date(request.activityTime).getTime() <= Date.now(),
            }
          : null,
        // 契约：仅 approved 披露发布者微信号
        publisherWechatId: app.status === 'approved' && publisher ? publisher.wechatId : null,
      });
    }
    return { list, total, page, pageSize };
  }
}
