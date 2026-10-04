import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, ListApplicationsDto, ReviewDto } from './applications.dto';
import { CurrentUser } from '../common/jwt-auth';

@Controller()
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  /** 申请加入（必附留言） */
  @Post('requests/:id/applications')
  async apply(
    @CurrentUser() user: { id: number },
    @Param('id') requestId: number,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.service.apply(user.id, Number(requestId), dto);
  }

  /** 某活动的申请列表（仅发布者） */
  @Get('requests/:id/applications')
  async listByRequest(
    @CurrentUser() user: { id: number },
    @Param('id') requestId: number,
    @Query() q: ListApplicationsDto,
  ) {
    return this.service.listByRequest(user.id, Number(requestId), q.status, q.page, q.pageSize);
  }

  /** 审批：approve | reject */
  @Patch('applications/:id')
  async review(
    @CurrentUser() user: { id: number },
    @Param('id') id: number,
    @Body() dto: ReviewDto,
  ) {
    return this.service.review(user.id, Number(id), dto.action);
  }

  /** 我的申请列表 */
  @Get('users/me/applications')
  async myApplications(@CurrentUser() user: { id: number }, @Query() q: ListApplicationsDto) {
    return this.service.myApplications(user.id, q.page, q.pageSize);
  }
}
