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
    } catch {
      // 静默失败
    }
  },
  clearUnread: () => {
    set({ count: 0 });
  },
}));
