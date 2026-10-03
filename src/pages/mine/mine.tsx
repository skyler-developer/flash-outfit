import Taro, { useDidShow, useLoad } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import SmartImage from '@/components/smartImage';
import PageLayout from '@/components/pageLayout';
import CustomTabBar from '@/customTabBar';
import { useUserStore } from '@/stores/userStore/useUserStore';
import { useTabsStore } from '@/stores/tabsStore/useTabsStore';
import { useUnreadStore } from '@/stores/unreadStore/useUnreadStore';
import { ACTIVITY_TYPES } from '@/pages/publish/constants';
import styles from './mine.module.scss';

export default function Mine() {
  const { setSelectedTab } = useTabsStore();
  const user = useUserStore((s) => s.user);
  const refreshUser = useUserStore((s) => s.refreshUser);
  const logout = useUserStore((s) => s.logout);
  const unreadCount = useUnreadStore((s) => s.count);
  const refreshUnread = useUnreadStore((s) => s.refreshUnread);

  useLoad(() => {
    refreshUser().catch(() => {
      // token 失效等场景静默处理
    });
  });

  // 每次进入页面同步 tabBar 选中态（switchTab 回来时 useLoad 不会重新执行）
  useDidShow(() => {
    setSelectedTab(2);
    refreshUnread();
  });

  const goToEdit = () => {
    Taro.navigateTo({ url: '/pages/profileEdit/profileEdit' });
  };

  const goToMessages = () => {
    Taro.navigateTo({ url: '/pages/message/message' });
  };

  const goToMyRequests = () => {
    Taro.navigateTo({ url: '/pages/myRequests/myRequests' });
  };

  const goToMyApplications = () => {
    Taro.navigateTo({ url: '/pages/myApplications/myApplications' });
  };

  const goToCommunityRules = () => {
    Taro.navigateTo({ url: '/pages/communityRules/communityRules' });
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmColor: '#F49D25',
      success: (res) => {
        if (res.confirm) {
          logout();
          Taro.showToast({ title: '已退出', icon: 'none' });
          // 重新触发登录，回到游客可用状态
          useUserStore.getState().ensureLogin();
        }
      },
    });
  };

  const interestLabels = (user?.interests || [])
    .map((i) => ACTIVITY_TYPES.find((t) => t.type === i)?.label || i)
    .join(' / ');

  return (
    <PageLayout>
      <View className={styles.page}>
        {/* 资料卡 */}
        <View className={styles.profileCard} onClick={goToEdit}>
          {user?.avatar ? (
            <SmartImage className={styles.avatar} src={user.avatar} mode='aspectFill' />
          ) : (
            <View className={`${styles.avatar} ${styles.avatarFallback}`}>
              <Text className={styles.avatarText}>
                {user?.nickname ? user.nickname.slice(0, 1) : '客'}
              </Text>
            </View>
          )}
          <View className={styles.profileInfo}>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{user?.nickname || '未设置昵称'}</Text>
              {user?.profileCompleted ? (
                <View className={styles.completeChip}>
                  <Text className={styles.completeChipText}>资料完整</Text>
                </View>
              ) : (
                <View className={styles.incompleteChip}>
                  <Text className={styles.incompleteChipText}>待完善</Text>
                </View>
              )}
            </View>
            <Text className={styles.meta}>
              {user?.gender ? (user.gender === 'female' ? '♀' : '♂') : ''}
              {user?.age ? ` ${user.age}岁` : ''}
              {interestLabels ? ` · ${interestLabels}` : ''}
            </Text>
            <Text className={styles.wechatRow}>
              微信号：{user?.wechatId ? <Text className={styles.wechatId}>{user.wechatId}</Text> : (
                <Text className={styles.wechatEmpty}>未填写（发布前需填写）</Text>
              )}
            </Text>
          </View>
          <Text className={styles.editIcon}>›</Text>
        </View>

        {/* 入口列表 */}
        <View className={styles.menuCard}>
          <View className={styles.menuItem} onClick={goToMessages}>
            <Text className={`iconfont icon-flash-outfitmessage ${styles.menuIcon}`} />
            <Text className={styles.menuLabel}>消息</Text>
            {unreadCount > 0 && (
              <View className={styles.unreadBadge}>
                <Text className={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuDivider} />
          <View className={styles.menuItem} onClick={goToMyRequests}>
            <Text className={`iconfont icon-flash-outfitpublish ${styles.menuIcon}`} />
            <Text className={styles.menuLabel}>我发布的请求</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuDivider} />
          <View className={styles.menuItem} onClick={goToMyApplications}>
            <Text className={`iconfont icon-flash-outfitPartnerPreference ${styles.menuIcon}`} />
            <Text className={styles.menuLabel}>我的申请</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuDivider} />
          <View className={styles.menuItem} onClick={goToCommunityRules}>
            <Text className={`iconfont icon-flash-outfitcalendar ${styles.menuIcon}`} />
            <Text className={styles.menuLabel}>社区公约</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>

        {/* 退出登录 */}
        <View className={styles.menuCard}>
          <View className={styles.menuItem} onClick={handleLogout}>
            <Text className={`iconfont icon-flash-outfitmine ${styles.menuIcon}`} />
            <Text className={styles.menuLabel}>退出登录</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>

        <CustomTabBar />
      </View>
    </PageLayout>
  );
}
