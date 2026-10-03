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
import * as path from 'path';
import { Public } from '../common/jwt-auth';
import { appConfig } from '../common/config';
import { ErrorCode, err } from '../common/errors';
import { StorageService } from './storage.service';

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 10 * 1024 * 1024;

/**
 * 图片上传：开发走本地静态目录（server/uploads/），
 * 生产由 STORAGE_TYPE=cos 切换到腾讯云 COS（见 StorageService）。
 */
@Controller('upload')
export class UploadController {
  constructor(private readonly storage: StorageService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw err(ErrorCode.PARAM_INVALID, '缺少文件');
    if (file.size > MAX_SIZE) throw err(ErrorCode.PARAM_INVALID, '图片不能超过 10MB');

    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ALLOWED_EXT.includes(ext) ? ext : '.jpg';

    const url = await this.storage.saveImage(file.buffer, safeExt);
    return { url };
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
      // 开发降级：未配置地图 key，无城市名（前端会引导手动输入）
      return { province: '', city: '', district: '' };
    }

    const url =
      `https://apis.map.qq.com/ws/geocoder/v1/?location=${latNum},${lngNum}` +
      `&key=${appConfig.tencentMapKey}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      status: number;
      result?: { address_component?: { province?: string; city?: string; district?: string } };
    };
    if (data.status !== 0 || !data.result?.address_component) {
      return { province: '', city: '', district: '' };
    }
    return {
      province: data.result.address_component.province || '',
      city: data.result.address_component.city || '',
      district: data.result.address_component.district || '',
    };
  }
}
