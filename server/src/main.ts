import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import * as path from 'path';
import { Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/response.interceptor';
import { AllExceptionFilter } from './common/all-exception.filter';
import { JwtAuthGuard } from './common/jwt-auth';
import { appConfig } from './common/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀 + 本地静态资源（无论存储模式都挂载：cos 模式下新图走桶域名，
  // 本地目录继续兼容历史数据里 localhost 形式的旧 URL）
  app.setGlobalPrefix('api/v1');
  app.use(
    '/api/v1/uploads',
    express.static(path.resolve(process.cwd(), appConfig.uploadDir)),
  );

  // 全局管道（class-validator DTO 校验）+ 统一响应/异常
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalGuards(app.get(JwtAuthGuard));
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionFilter());
  app.enableCors();

  await app.listen(appConfig.port);
  console.log(`[flash-outfit] server running at http://localhost:${appConfig.port}/api/v1`);
}
bootstrap();
