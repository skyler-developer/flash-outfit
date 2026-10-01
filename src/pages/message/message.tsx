import { useState } from 'react';
import Taro, { useLoad } from '@tarojs/taro';
import { ScrollView, Text, View } from '@tarojs/components';
import PageLayout from '@/components/pageLayout';
import CustomTabBar from '@/customTabBar';
import {
  listNotifications,
  markRead,
  markAllRead,
  NotificationItem,
} from '@/api/notification';
import { useUnreadStore } from '@/stores/unreadStore/useUnreadStore';
import { useUserStore } from '@/stores/userStore/useUserStore';
import { useTabsStore } from '@/stores/tabsStore/useTabsStore';
import styles from './message.module.scss';

const TYPE_ICON: Record<string, { cls: string; color: string }> = {
  newApply: { cls: 'icon-flash-outfitmessage', color: '#F49D25' },
  applyApproved: { cls: 'icon-flash-outfitPartnerPreference', color: '#16A34A' },
  applyRejected: { cls: 'icon-flash-outfitcalendar', color: '#DC2626' },
  requestClosed: { cls: 'icon-flash-outfitcalendar', color: '#64748B' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}小时前`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}天前`;
  return iso.slice(0, 10);
}

export default function Message() {
  const { setSelectedTab } = useTabsStore();
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshUnread = useUnreadStore((s) => s.refreshUnread);
  const ensureLogin = useUserStore((s) => s.ensureLogin);

  const load = async () => {
    try {
      await ensureLogin();
      const res = await listNotifications(1, 50);
      setList(res.list);
    } catch (e) {
      const err = e as { message?: string };
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useLoad(() => {
    setSelectedTab(1);
    load();
  });

  const handleTapItem = async (item: NotificationItem) => {
    // 点击标记已读
    if (!item.isRead) {
      try {
        await markRead(item.id);
        setList((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
        refreshUnread();
      } catch {
        // 忽略：下次进入再标记
      }
    }
    // 跳转：newApply → 管理页；applyApproved/applyRejected → 我的申请；requestClosed → 我的申请
    if (item.type === 'newApply') {
      Taro.navigateTo({ url: `/pages/manageRequest/manageRequest?id=${item.relatedId}` });
    } else {
      Taro.navigateTo({ url: '/pages/myApplications/myApplications' });
    }
  };

  const handleMarkAll = async () => {
    if (list.every((n) => n.isRead)) return;
    try {
      await markAllRead();
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshUnread();
      Taro.showToast({ title: '已全部标记为已读', icon: 'none' });
    } catch (e) {
      const err = e as { message?: string };
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  };

  return (
    <PageLayout>
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.headerTitle}>消息</Text>
          {list.some((n) => !n.isRead) && (
            <View className={styles.readAllBtn} onClick={handleMarkAll}>
              <Text className={styles.readAllText}>全部已读</Text>
            </View>
          )}
        </View>

        <ScrollView scrollY className={styles.list}>
          {list.map((item) => {
            const icon = TYPE_ICON[item.type] || TYPE_ICON.requestClosed;
            return (
              <View
                key={item.id}
                className={`${styles.item} ${item.isRead ? '' : styles.itemUnread}`}
                onClick={() => handleTapItem(item)}
              >
                <View className={styles.iconWrap} style={{ background: `${icon.color}1A` }}>
                  <Text className={`iconfont ${icon.cls}`} style={{ color: icon.color, fontSize: '36px' }} />
                </View>
                <View className={styles.content}>
                  <View className={styles.titleRow}>
                    <Text className={`${styles.title} ${item.isRead ? '' : styles.titleUnread}`}>
                      {item.title}
                    </Text>
                    {!item.isRead && <View className={styles.dot} />}
                  </View>
                  <Text className={styles.time}>{timeAgo(item.createdAt)}</Text>
                </View>
                <Text className={styles.arrow}>›</Text>
              </View>
            );
          })}
          {!loading && list.length === 0 && (
            <View className={styles.empty}>
              <Text className={styles.emptyText}>暂无消息，去发布或申请一个搭子吧</Text>
            </View>
          )}
          <View className={styles.bottomSpace} />
        </ScrollView>
        <CustomTabBar />
      </View>
    </PageLayout>
  );
}
