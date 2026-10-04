import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { ActivityRequest } from './entities/request.entity';

/**
 * 开发种子数据：3 个用户 + 8 条覆盖新旧类型的招募中活动。
 * 直接跑：npm run seed（需先 npm run build）
 */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);

  const usersRepo = ds.getRepository(User);
  const requestsRepo = ds.getRepository(ActivityRequest);

  // 清空旧种子
  await ds.query('DELETE FROM requests');
  await ds.query('DELETE FROM applications');
  await ds.query('DELETE FROM notifications');
  await ds.query('DELETE FROM users');

  const day = (n: number, h = 9) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(h, 0, 0, 0);
    return d.toISOString();
  };

  const mk = (o: Partial<User>) => usersRepo.create({ interests: [], ...o });

  const [u1, u2, u3] = await usersRepo.save([
    mk({
      openid: 'mock:alice',
      nickname: '阿黄爱拍照',
      avatar: 'http://localhost:3000/api/v1/uploads/r/avatar.jpg',
      gender: 'female',
      birthYear: 1998,
      wechatId: 'ahuang_98',
      interests: ['photography', 'travel'],
    }),
    mk({
      openid: 'mock:bob',
      nickname: '山野小蓝',
      avatar: 'http://localhost:3000/api/v1/uploads/r/avatar.jpg',
      gender: 'male',
      birthYear: 1997,
      wechatId: 'xiaolan27',
      interests: ['sports', 'photography', 'food'],
    }),
    mk({
      openid: 'mock:carol',
      nickname: '走走停停',
      avatar: 'http://localhost:3000/api/v1/uploads/r/avatar.jpg',
      gender: 'female',
      birthYear: 1995,
      wechatId: 'carol_trip',
      interests: ['travel', 'outdoor', 'show'],
    }),
  ]);

  const req = (o: Partial<ActivityRequest>) =>
    requestsRepo.create({
      type: 'travel',
      title: o.title || o.destination || '一起出发',
      activityTime: day(3),
      destination: '目的地',
      lat: 39.9,
      lng: 116.4,
      city: '北京',
      locationName: o.city || '北京',
      genderPreference: 'all',
      ageMin: 18,
      ageMax: 40,
      maxMembers: 1,
      autoCloseOnGrouped: false,
      description: '这是一段长度满足校验的示例描述，周末一起出发。',
      photos: [],
      status: 'recruiting',
      ...o,
    });

  await requestsRepo.save([
    req({
      publisherId: u1.id,
      type: 'photography',
      activityTime: day(2, 18),
      destination: '东澳岛拍星轨',
      lat: 22.017,
      lng: 113.717,
      city: '珠海',
      ageMin: 20,
      ageMax: 35,
      description: '周末东澳岛拍星轨，两日一晚，找个会拍照的搭子，我带三脚架你带好心情。',
      photos: ['http://localhost:3000/api/v1/uploads/r/seed1.jpg'],
    }),
    req({
      publisherId: u2.id,
      type: 'sports',
      activityTime: day(1, 7),
      destination: '奥森晨跑 10km',
      lat: 40.01,
      lng: 116.39,
      city: '北京',
      genderPreference: 'male',
      description: '周六早上奥森南门集合，配速 6 分，跑完一起吃早餐，长期固定搭子更好。',
      photos: ['http://localhost:3000/api/v1/uploads/r/seed2.jpg'],
    }),
    req({
      publisherId: u3.id,
      type: 'travel',
      activityTime: day(9),
      destination: '川西小环线自驾',
      lat: 30.05,
      lng: 101.96,
      city: '成都',
      ageMin: 24,
      ageMax: 45,
      maxMembers: 3,
      description: '五一后错峰川西小环线 5 天自驾，已订好车，找会开车的搭子平摊油费。',
      photos: ['http://localhost:3000/api/v1/uploads/r/seed3.jpg'],
    }),
    req({
      publisherId: u1.id,
      type: 'travel',
      activityTime: day(20),
      destination: '青甘大环线拼车',
      lat: 36.62,
      lng: 101.78,
      city: '西宁',
      description: '青甘大环线 7 天 6 晚，摄影向行程，日出日落各追一场，AA 制无购物。',
      photos: ['http://localhost:3000/api/v1/uploads/r/seed4.jpg'],
    }),
    req({
      publisherId: u2.id,
      type: 'photography',
      activityTime: day(5, 16),
      destination: '798 扫街互拍',
      lat: 39.98,
      lng: 116.49,
      city: '北京',
      description: '周中下午 798 扫街，人像互拍，我有相机有镜头，你出镜即可，出片全送。',
      photos: ['http://localhost:3000/api/v1/uploads/r/seed5.jpg'],
    }),
    req({
      publisherId: u3.id,
      type: 'sports',
      activityTime: day(4, 19),
      destination: '首钢园夜骑',
      lat: 39.93,
      lng: 116.17,
      city: '北京',
      genderPreference: 'female',
      description: '周三晚首钢园夜骑 20km，之后夜宵烧烤，女生优先，注意保暖和车灯。',
      photos: ['http://localhost:3000/api/v1/uploads/r/seed6.jpg'],
    }),
    req({
      publisherId: u2.id,
      type: 'food',
      activityTime: day(2, 12),
      destination: '牛街小吃扫街',
      lat: 39.88,
      lng: 116.36,
      city: '北京',
      description: '周六中午牛街一路吃过去，洪记年糕、聚宝源涮肉都安排，能吃辣优先。',
      photos: ['http://localhost:3000/api/v1/uploads/r/seed7.jpg'],
    }),
    req({
      publisherId: u3.id,
      type: 'show',
      activityTime: day(6, 20),
      destination: 'IMAX《沙丘 3》搭伴观影',
      lat: 39.92,
      lng: 116.46,
      city: '北京',
      description: '找一位同样想看 IMAX 的搭子，散场后可以顺路喝一杯聊聊剧情。',
      photos: ['http://localhost:3000/api/v1/uploads/r/seed8.jpg'],
    }),
  ]);

  console.log('✅ seed done: 3 users, 8 requests');
  await app.close();
}
seed();
