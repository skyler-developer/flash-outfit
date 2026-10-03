import Taro from '@tarojs/taro';

/** 后端 API 地址：构建期由 defineConstants 注入（开发=本地服务，生产=正式域名） */
const BASE_URL = API_BASE_URL;

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

let reloginPromise: Promise<string | null> | null = null;

/** 静默重登：wx.login 换新 token（防并发重入） */
async function silentRelogin(): Promise<string | null> {
  if (reloginPromise) return reloginPromise;
  reloginPromise = (async () => {
    try {
      const { code } = await Taro.login();
      const res = await Taro.request<ApiResponse<{ token: string }>>({
        url: `${BASE_URL}/auth/login`,
        method: 'POST',
        data: { code },
        header: { 'x-dev-user': Taro.getStorageSync('devUser') || '' },
      });
      const token = res.data?.data?.token;
      if (token) {
        Taro.setStorageSync('token', token);
        return token;
      }
      return null;
    } catch {
      return null;
    } finally {
      reloginPromise = null;
    }
  })();
  return reloginPromise;
}

export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: unknown;
  /** 已重试过 401 则不再重放 */
  _retried?: boolean;
}

/** 统一请求：token 注入 + 401 静默重登重放 + 业务码抛错 */
export async function request<T = unknown>(options: RequestOptions): Promise<T> {
  const token = Taro.getStorageSync('token');
  try {
    const res = await Taro.request<ApiResponse<T>>({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const body = res.data;
    if (!body || typeof body.code !== 'number') {
      throw { code: 5000, message: '响应格式异常' };
    }
    if (body.code === 0) return body.data;

    if (body.code === 4010 && !options._retried) {
      const newToken = await silentRelogin();
      if (newToken) {
        return request<T>({ ...options, _retried: true });
      }
    }

    throw { code: body.code, message: body.message };
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    // 网络层失败（非业务码）：透出 Taro errMsg 便于诊断（如域名拦截）
    if (err.code === undefined) {
      const raw = e as { errMsg?: string };
      const detail = raw?.errMsg?.replace(/^request:fail\s*/i, '') || '';
      throw {
        code: 5000,
        message: detail ? `网络异常：${detail}` : '网络异常，请稍后重试',
      };
    }
    throw err;
  }
}

export { BASE_URL };
