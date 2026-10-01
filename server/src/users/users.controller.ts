import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from '../common/dto';
import { CurrentUser } from '../common/jwt-auth';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** 获取我的资料 */
  @Get('me')
  async me(@CurrentUser() user: { id: number }) {
    return this.usersService.getMe(user.id);
  }

  /** 更新我的资料（仅传需更新字段） */
  @Patch('me')
  async updateMe(@CurrentUser() user: { id: number }, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(user.id, dto);
  }

  /** 用户公开资料（详情页发起人卡片 / 审批页申请人卡片用） */
  @Get(':id/public')
  async publicUser(@Param('id') id: number) {
    return this.usersService.publicUser(Number(id));
  }
}
