import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
  ) {}

  /** 内部调用：写入通知 */
  async push(userId: number, type: NotificationType, relatedId: number, title: string) {
    await this.repo.save(this.repo.create({ userId, type, relatedId, title }));
  }

  async list(userId: number, page = 1, pageSize = 10) {
    const [items, total] = await this.repo.findAndCount({
      where: { userId },
      order: { id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      list: items.map((n) => ({
        id: n.id,
        type: n.type,
        relatedId: n.relatedId,
        title: n.title,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async unreadCount(userId: number) {
    const count = await this.repo.count({ where: { userId, isRead: false } });
    return { count };
  }

  async markRead(userId: number, id: number) {
    const n = await this.repo.findOneBy({ id, userId });
    if (!n) throw new NotFoundException();
    await this.repo.update(id, { isRead: true });
    return null;
  }

  async markAllRead(userId: number) {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
    return null;
  }
}
