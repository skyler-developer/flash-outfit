import Taro from '@tarojs/taro';
import { create } from 'zustand';
import { unreadCount } from '@/api/notification';

interface UnreadStore {
  count: number;
  refreshUnread: () => Promise<void>;
  clearUnread: () => void;
}

export const useUnreadStore = create<UnreadStore>((set) => ({
  count: 0,
  refreshUnread: async () => {
    try {
      const { count } = await unreadCount();
      set({ count });
      if (count > 0) {
        Taro.setTabBarBadge({ index: 1, text: String(count > 99 ? '99+' : count) }).catch(() => undefined);
      } else {
        Taro.removeTabBarBadge({ index: 1 }).catch(() => undefined);
      }
    } catch {
      // 静默失败
    }
  },
  clearUnread: () => {
    set({ count: 0 });
    Taro.removeTabBarBadge({ index: 1 }).catch(() => undefined);
  },
}));
