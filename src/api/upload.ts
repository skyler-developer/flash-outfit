import Taro from '@tarojs/taro';
import { request, BASE_URL } from './request';

/** 上传单张图片（multipart） */
export async function uploadImage(filePath: string): Promise<string> {
  const token = Taro.getStorageSync('token');
  let res: Taro.uploadFile.SuccessCallbackResult;
  try {
    res = await Taro.uploadFile({
      url: `${BASE_URL}/upload/image`,
      filePath,
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
