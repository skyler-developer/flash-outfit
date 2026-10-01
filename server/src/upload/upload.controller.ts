import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '../common/jwt-auth';
import { appConfig } from '../common/config';
import { ErrorCode, err } from '../common/errors';

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 10 * 1024 * 1024;

/**
 * 图片上传：开发阶段本地静态目录（server/uploads/），
 * 上线切 OSS/COS 只需替换 saveFile 内部实现（StorageService 适配器模式）。
 */
@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw err(ErrorCode.PARAM_INVALID, '缺少文件');
    if (file.size > MAX_SIZE) throw err(ErrorCode.PARAM_INVALID, '图片不能超过 10MB');

    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ALLOWED_EXT.includes(ext) ? ext : '.jpg';

    const dir = path.resolve(process.cwd(), appConfig.uploadDir, 'r');
    fs.mkdirSync(dir, { recursive: true });
    const filename = `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${safeExt}`;
    fs.writeFileSync(path.join(dir, filename), file.buffer);

    return { url: `${appConfig.publicBaseUrl}/uploads/r/${filename}` };
  }
}

/** 逆地理编码代理：腾讯位置服务（key 存服务端），未配置时返回降级结果 */
@Controller('geo')
export class GeoController {
  @Public()
  @Get('reverse')
  async reverse(@Query('lat') lat: string, @Query('lng') lng: string) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      throw err(ErrorCode.PARAM_INVALID, 'lat/lng 参数错误');
    }

    if (!appConfig.tencentMapKey) {
      // 开发降级：不调用外部服务
      return { city: '未知城市', district: '' };
    }

    const url =
      `https://apis.map.qq.com/ws/geocoder/v1/?location=${latNum},${lngNum}` +
      `&key=${appConfig.tencentMapKey}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      status: number;
      result?: { address_component?: { city?: string; district?: string } };
    };
    if (data.status !== 0 || !data.result?.address_component) {
      return { city: '未知城市', district: '' };
    }
    return {
      city: data.result.address_component.city || '未知城市',
      district: data.result.address_component.district || '',
    };
  }
}
