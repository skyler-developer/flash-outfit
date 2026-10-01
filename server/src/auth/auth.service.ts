import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, calcAge, profileCompleted, Interest } from '../entities/user.entity';
import { appConfig } from '../common/config';

export function toUserDto(u: User) {
  return {
    id: u.id,
    nickname: u.nickname,
    avatar: u.avatar,
    gender: u.gender,
    birthYear: u.birthYear,
    age: u.birthYear ? calcAge(u.birthYear) : null,
    wechatId: u.wechatId,
    interests: u.interests || [],
    profileCompleted: profileCompleted(u),
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 获取 openid：
   * - 已配置 WX_APPID/WX_SECRET：真实调用 code2Session
   * - 未配置（开发）：mock 模式，openid = mock:${devUser || code}，
   *   前端联调时可传 x-dev-user 头固定身份，便于多用户测试
   */
  private async resolveOpenid(code: string, devUser?: string): Promise<string> {
    if (appConfig.wx.appid && appConfig.wx.secret) {
      const url =
        `https://api.weixin.qq.com/sns/jscode2session?appid=${appConfig.wx.appid}` +
        `&secret=${appConfig.wx.secret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
      const res = await fetch(url);
      const data = (await res.json()) as { openid?: string; errcode?: number; errmsg?: string };
      if (!data.openid) {
        throw new UnauthorizedException(`code2Session 失败: ${data.errcode} ${data.errmsg}`);
      }
      return data.openid;
    }
    return `mock:${devUser || code}`;
  }

  async login(code: string, devUser?: string) {
    const openid = await this.resolveOpenid(code, devUser);
    let user = await this.usersRepo.findOneBy({ openid });
    if (!user) {
      user = await this.usersRepo.save(
        this.usersRepo.create({ openid, interests: [] as Interest[] }),
      );
    }
    const token = this.jwtService.sign({ sub: user.id });
    return { token, user: toUserDto(user) };
  }
}
