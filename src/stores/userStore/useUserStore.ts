import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { login, getMe, updateMe, UserInfo, UpdateMeParams } from '@/api/auth';

interface UserStore {
  user: UserInfo | null;
  isLoggedIn: boolean;
  loading: boolean;

  /** 静默登录（app 启动时调用） */
  ensureLogin: () => Promise<void>;
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
    // 已有 token：直接拉资料验证
    if (Taro.getStorageSync('token')) {
      try {
        await get().refreshUser();
        if (get().isLoggedIn) return;
      } catch {
        // token 失效，走重新登录
      }
    }
    if (get().loading) return;
    set({ loading: true });
    try {
      const { code } = await Taro.login();
      const res = await login(code);
      Taro.setStorageSync('token', res.token);
      set({ user: res.user, isLoggedIn: true });
    } catch {
      set({ isLoggedIn: false, user: null });
    } finally {
      set({ loading: false });
    }
  },

  refreshUser: async () => {
    const user = await getMe();
    set({ user, isLoggedIn: true });
  },

  patchUser: async (params) => {
    const user = await updateMe(params);
    set({ user });
    return user;
  },

  logout: () => {
    Taro.removeStorageSync('token');
    set({ user: null, isLoggedIn: false });
  },
}));
