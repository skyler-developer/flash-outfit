import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { login, getMe, updateMe, UserInfo, UpdateMeParams } from '@/api/auth';

let loginPromise: Promise<UserInfo> | null = null;
let authVersion = 0;

interface UserStore {
  user: UserInfo | null;
  isLoggedIn: boolean;
  loading: boolean;

  /** 静默登录（app 启动时调用） */
  ensureLogin: () => Promise<void>;
  /** 用户主动点击登录时使用，失败则向页面抛出原因 */
  loginWithWechat: () => Promise<UserInfo>;
  /** 拉取最新资料 */
  refreshUser: () => Promise<void>;
  /** 更新资料 */
  patchUser: (params: UpdateMeParams) => Promise<UserInfo>;
  /** 退出登录（清 token） */
  logout: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isLoggedIn: false,
  loading: false,

  ensureLogin: async () => {
    // 用户主动退出后保持游客状态，不能在重新进入页面时静默登录。
    if (Taro.getStorageSync('manualLogout')) return;
    // 已有 token：直接拉资料验证
    if (Taro.getStorageSync('token')) {
      try {
        await get().refreshUser();
        if (get().isLoggedIn) return;
      } catch {
        // token 失效，走重新登录
      }
    }
    try {
      await get().loginWithWechat();
    } catch {
      // 静默登录失败时保持游客状态，由用户在“我的”页主动重试。
    }
  },

  loginWithWechat: () => {
    if (loginPromise) return loginPromise;
    const version = authVersion;
    set({ loading: true });
    loginPromise = (async () => {
      try {
        const { code } = await Taro.login();
        const res = await login(code);
        if (version !== authVersion) throw new Error('登录已取消');
        Taro.setStorageSync('token', res.token);
        Taro.removeStorageSync('manualLogout');
        set({ user: res.user, isLoggedIn: true });
        return res.user;
      } catch (error) {
        if (version === authVersion) set({ isLoggedIn: false, user: null });
        throw error;
      } finally {
        loginPromise = null;
        set({ loading: false });
      }
    })();
    return loginPromise;
  },

  refreshUser: async () => {
    const version = authVersion;
    const user = await getMe();
    if (version === authVersion && !Taro.getStorageSync('manualLogout')) {
      set({ user, isLoggedIn: true });
    }
  },

  patchUser: async (params) => {
    const user = await updateMe(params);
    set({ user });
    return user;
  },

  logout: () => {
    authVersion += 1;
    Taro.removeStorageSync('token');
    Taro.setStorageSync('manualLogout', true);
    set({ user: null, isLoggedIn: false });
  },
}));
