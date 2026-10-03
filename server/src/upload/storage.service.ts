import { Injectable } from '@nestjs/common';
import COS from 'cos-nodejs-sdk-v5';
import * as fs from 'fs';
import * as path from 'path';
import { appConfig } from '../common/config';

/**
 * 图片存储抽象：开发走本地磁盘（server/uploads/），生产走腾讯云 COS。
 * 由 STORAGE_TYPE 环境变量切换（local | cos），业务代码只依赖本服务。
 */
@Injectable()
export class StorageService {
  private cos: COS | null = null;

  constructor() {
    if (appConfig.storage.type === 'cos') {
      const { secretId, secretKey } = appConfig.storage.cos;
      if (!secretId || !secretKey) {
        throw new Error(
          'STORAGE_TYPE=cos 需要同时配置 COS_SECRET_ID / COS_SECRET_KEY 环境变量',
        );
      }
      this.cos = new COS({ SecretId: secretId, SecretKey: secretKey });
    }
  }

  /**
   * 保存图片并返回可直接访问的完整 URL。
   * @param buffer 文件内容
   * @param ext 含点后缀（.jpg/.png/.webp），已由调用方白名单校验
   * @param prefix 对象 key 前缀（目录名），默认 r
   */
  async saveImage(buffer: Buffer, ext: string, prefix = 'r'): Promise<string> {
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    if (this.cos) {
      return this.saveToCos(buffer, `${prefix}/${filename}`);
    }
    return this.saveToLocal(buffer, prefix, filename);
  }

  private saveToLocal(buffer: Buffer, prefix: string, filename: string): string {
    const dir = path.resolve(process.cwd(), appConfig.uploadDir, prefix);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
    return `${appConfig.publicBaseUrl}/api/v1/uploads/${prefix}/${filename}`;
  }

  private saveToCos(buffer: Buffer, key: string): Promise<string> {
    const { bucket, region, baseUrl } = appConfig.storage.cos;
    return new Promise((resolve, reject) => {
      this.cos!.putObject(
        {
          Bucket: bucket,
          Region: region,
          Key: key,
          Body: buffer,
        },
        (err) => {
          if (err) {
            reject(new Error(`COS 上传失败: ${err.message || String(err)}`));
          } else {
            resolve(`${baseUrl}/${key}`);
          }
        },
      );
    });
  }
}
