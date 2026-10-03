import Taro from '@tarojs/taro';
import { request, BASE_URL } from './request';

/** 压缩目标：小程序展示 750px 设计稿宽足够，兼顾头像等小图不误压 */
const COMPRESS_MAX_WIDTH = 1080;

/**
 * 上传前压缩：大于 maxWidth 的图缩小并重编码（quality 0.8 的 jpg，
 * 手机原图 3MB+ 可压到 200-400KB）。失败时降级返回原图（不阻断上传）。
 * （chooseAvatar 头像等本地临时图不受 sizeType 压缩影响，仍需这一步）
 */
async function compressBeforeUpload(filePath: string): Promise<string> {
  try {
    const info = await Taro.getImageInfo({ src: filePath });
    if (info.width <= COMPRESS_MAX_WIDTH) return filePath;
    const res = await Taro.compressImage({
      src: filePath,
      quality: 80,
      compressedWidth: COMPRESS_MAX_WIDTH,
    });
    return res.tempFilePath;
  } catch {
    return filePath; // 压缩失败（如 gif 不支持）则直接传原图
  }
}

/** 上传单张图片（multipart，上传前自动压缩） */
export async function uploadImage(filePath: string): Promise<string> {
  const token = Taro.getStorageSync('token');
  const compressed = await compressBeforeUpload(filePath);
  let res: Taro.uploadFile.SuccessCallbackResult;
  try {
    res = await Taro.uploadFile({
      url: `${BASE_URL}/upload/image`,
      filePath: compressed,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (e) {
    // 网络层失败（如域名拦截）：透出 errMsg 便于诊断
    const raw = e as { errMsg?: string };
    const detail = raw?.errMsg?.replace(/^uploadFile:fail\s*/i, '') || '';
    throw { code: 5000, message: detail ? `上传失败：${detail}` : '上传失败，请检查网络' };
  }
  let body: { code: number; message: string; data: { url: string } };
  try {
    body = JSON.parse(res.data);
  } catch {
    throw { code: 5000, message: `上传响应异常（HTTP ${res.statusCode}）` };
  }
  if (body.code !== 0) {
    throw { code: body.code, message: body.message };
  }
  return body.data.url;
}

/** 逆地理编码（服务端代理腾讯位置服务） */
export async function reverseGeo(lat: number, lng: number) {
  return request<{ province: string; city: string; district: string }>({
    url: `/geo/reverse?lat=${lat}&lng=${lng}`,
  });
}
