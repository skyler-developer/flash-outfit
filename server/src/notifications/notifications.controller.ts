import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PaginationDto } from '../common/dto';
import { CurrentUser } from '../common/jwt-auth';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: { id: number }, @Query() q: PaginationDto) {
    return this.service.list(user.id, q.page, q.pageSize);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: { id: number }) {
    return this.service.unreadCount(user.id);
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: { id: number }) {
    return this.service.markAllRead(user.id);
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: { id: number }, @Param('id') id: number) {
    return this.service.markRead(user.id, Number(id));
  }
}
