import { Controller, Get, Query } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { PaginationDto } from '../common/dto';
import { CurrentUser } from '../common/jwt-auth';

@Controller('users/me/requests')
export class MyRequestsController {
  constructor(private readonly service: RequestsService) {}

  /** 我发布的活动列表（含 pendingCount 角标统计） */
  @Get()
  async myPublished(@CurrentUser() user: { id: number }, @Query() q: PaginationDto) {
    return this.service.myPublished(user.id, q.page, q.pageSize);
  }
}
