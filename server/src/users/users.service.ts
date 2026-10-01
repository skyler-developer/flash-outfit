import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, calcAge, Interest } from '../entities/user.entity';
import { UpdateUserDto } from '../common/dto';
import { toUserDto } from '../auth/auth.service';
import { err, ErrorCode } from '../common/errors';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async getMe(id: number) {
    const user = await this.usersRepo.findOneBy({ id });
    if (!user) throw new NotFoundException();
    return toUserDto(user);
  }

  async updateMe(id: number, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOneBy({ id });
    if (!user) throw new NotFoundException();

    // 出生年份：仅允许成年用户（1900 ~ 当前年份-18）
    if (dto.birthYear !== undefined) {
      const minYear = 1900;
      const maxYear = new Date().getFullYear() - 18;
      if (dto.birthYear < minYear || dto.birthYear > maxYear) {
        throw err(ErrorCode.PARAM_INVALID, `出生年份需在 ${minYear}~${maxYear} 之间`);
      }
    }
    if (dto.birthYear !== undefined && dto.gender !== undefined) {
      // 单独校验出生年份与性别的组合无额外约束，占位保持可读
    }

    const patch: Partial<User> = {};
    if (dto.nickname !== undefined) patch.nickname = dto.nickname.trim();
    if (dto.avatar !== undefined) patch.avatar = dto.avatar;
    if (dto.gender !== undefined) patch.gender = dto.gender;
    if (dto.birthYear !== undefined) patch.birthYear = dto.birthYear;
    if (dto.wechatId !== undefined) patch.wechatId = dto.wechatId.trim();
    if (dto.interests !== undefined) patch.interests = [...new Set(dto.interests)] as Interest[];

    await this.usersRepo.update(id, patch);
    return this.getMe(id);
  }

  /** 公开资料：不含 wechatId/birthYear/openid */
  async publicUser(id: number) {
    const user = await this.usersRepo.findOneBy({ id });
    if (!user) throw new NotFoundException();
    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      age: user.birthYear ? calcAge(user.birthYear) : null,
      interests: user.interests || [],
    };
  }
}
