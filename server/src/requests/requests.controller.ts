import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto, ListRequestsDto, UpdateRequestDto } from './requests.dto';
import { CurrentUser } from '../common/jwt-auth';

@Controller('requests')
export class RequestsController {
  constructor(private readonly service: RequestsService) {}

  /** 请求流（首页） */
  @Get()
  async list(@CurrentUser() user: { id: number }, @Query() q: ListRequestsDto) {
    return this.service.list(user.id, q);
  }

  /** 请求详情 */
  @Get(':id')
  async detail(@CurrentUser() user: { id: number }, @Param('id') id: number) {
    return this.service.detail(user.id, Number(id));
  }

  /** 发布请求 */
  @Post()
  async create(@CurrentUser() user: { id: number }, @Body() dto: CreateRequestDto) {
    return this.service.create(user.id, dto);
  }

  /** 修改请求（仅发布者） */
  @Patch(':id')
  async update(
    @CurrentUser() user: { id: number },
    @Param('id') id: number,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.service.update(user.id, Number(id), dto);
  }

  /** 删除请求（仅发布者，通知全部申请人） */
  @Delete(':id')
  async remove(@CurrentUser() user: { id: number }, @Param('id') id: number) {
    return this.service.remove(user.id, Number(id));
  }
}
