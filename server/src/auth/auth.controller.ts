import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../common/dto';
import { Public } from '../common/jwt-auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 静默登录：wx.login code 换 token（未配置微信 appid 时为 mock 模式） */
  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Headers('x-dev-user') devUser?: string,
  ) {
    return this.authService.login(dto.code, devUser);
  }
}
