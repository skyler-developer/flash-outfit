import { useState } from 'react';
import Taro, { useDidShow, useLoad } from '@tarojs/taro';
import { View, Text, Button, Input } from '@tarojs/components';
import SmartImage from '@/components/smartImage';
import PageLayout from '@/components/pageLayout';
import CustomTabBar from '@/customTabBar';
import { useUserStore } from '@/stores/userStore/useUserStore';
import { useTabsStore } from '@/stores/tabsStore/useTabsStore';
import { useUnreadStore } from '@/stores/unreadStore/useUnreadStore';
import { ACTIVITY_TYPES } from '@/pages/publish/constants';
import { uploadImage } from '@/api/upload';
import styles from './mine.module.scss';

export default function Mine() {
  const { setSelectedTab } = useTabsStore();
  const user = useUserStore((s) => s.user);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const loginWithWechat = useUserStore((s) => s.loginWithWechat);
  const patchUser = useUserStore((s) => s.patchUser);
  const refreshUser = useUserStore((s) => s.refreshUser);
  const [loggingIn, setLoggingIn] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [wxNickname, setWxNickname] = useState('');
  const logout = useUserStore((s) => s.logout);
  const unreadCount = useUnreadStore((s) => s.count);
  const refreshUnread = useUnreadStore((s) => s.refreshUnread);

  useLoad(() => {
    if (Taro.getStorageSync('token') && !Taro.getStorageSync('manualLogout')) {
      refreshUser().catch(() => {
        // token 失效等场景静默处理
      });
    }
  });

  // 每次进入页面同步 tabBar 选中态（switchTab 回来时 useLoad 不会重新执行）
  useDidShow(() => {
    setSelectedTab(2);
    refreshUnread();
  });

  const goToEdit = () => {
    Taro.navigateTo({ url: '/pages/profileEdit/profileEdit' });
  };

  // 微信登录只返回身份，不包含头像昵称；旧版用户资料授权可用时自动保存，
  // 否则使用微信官方 chooseAvatar / nickname 输入能力让用户主动选择。
  const handleProfileClick = async () => {
    if (isLoggedIn && user?.avatar && user?.nickname) {
      goToEdit();
      return;
    }
    if (loggingIn) return;
    setLoggingIn(true);
    try {
      let wxProfile: { nickName: string; avatarUrl: string } | null = null;
      try {
        const result = await Taro.getUserProfile({ desc: '用于填写活动头像和昵称' });
        if (result.userInfo?.nickName && result.userInfo.nickName !== '微信用户') {
          wxProfile = result.userInfo;
        }
      } catch {
        // 新版微信不再提供头像昵称授权，登录后展示官方头像/昵称填写入口。
      }
      const current = isLoggedIn && user ? user : await loginWithWechat();
      if (wxProfile) {
        const changes: { nickname?: string; avatar?: string } = {};
        if (!current.nickname) changes.nickname = wxProfile.nickName.slice(0, 20);
        if (!current.avatar && wxProfile.avatarUrl) {
          try {
            const file = await Taro.downloadFile({ url: wxProfile.avatarUrl });
            changes.avatar = await uploadImage(file.tempFilePath);
          } catch {
            // 头像下载失败仍可使用下方“选择微信头像”单独完成。
          }
        }
        if (Object.keys(changes).length) {
          try {
            await patchUser(changes);
          } catch {
            // 登录已完成，资料更新失败不阻断；下方仍可分别填写头像和昵称。
          }
        }
      }
      Taro.showToast({ title: isLoggedIn ? '可继续完善资料' : '登录成功', icon: isLoggedIn ? 'none' : 'success' });
      refreshUnread();
    } catch (e) {
      const error = e as { message?: string };
      Taro.showToast({ title: error.message || '登录失败，请重试', icon: 'none' });
    } finally {
      setLoggingIn(false);
    }
  };

  const handleChooseWxAvatar = async (e: { detail: { avatarUrl: string } }) => {
    if (!e.detail.avatarUrl || savingProfile) return;
    setSavingProfile(true);
    try {
      const avatar = await uploadImage(e.detail.avatarUrl);
      await patchUser({ avatar });
      Taro.showToast({ title: '头像已保存', icon: 'success' });
    } catch (e) {
      const error = e as { message?: string };
      Taro.showToast({ title: error.message || '头像保存失败', icon: 'none' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveNickname = async () => {
    const nickname = wxNickname.trim();
    if (!nickname || savingProfile || nickname === user?.nickname) return;
    setSavingProfile(true);
    try {
      await patchUser({ nickname });
      Taro.showToast({ title: '昵称已保存', icon: 'success' });
    } catch (e) {
      const error = e as { message?: string };
      Taro.showToast({ title: error.message || '昵称保存失败', icon: 'none' });
    } finally {
      setSavingProfile(false);
    }
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
          useUnreadStore.getState().clearUnread();
          setWxNickname('');
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
        <View className={styles.profileCard} onClick={handleProfileClick}>
          {isLoggedIn && user?.avatar ? (
            <SmartImage className={styles.avatar} src={user.avatar} mode='aspectFill' />
          ) : (
            <View className={`${styles.avatar} ${styles.avatarFallback}`}>
              <Text className={styles.avatarText}>
                {isLoggedIn && user?.nickname ? user.nickname.slice(0, 1) : '客'}
              </Text>
            </View>
          )}
          <View className={styles.profileInfo}>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{!isLoggedIn ? '点击头像微信登录' : user?.nickname || '点击头像完善微信资料'}</Text>
              {!isLoggedIn ? null : user?.profileCompleted ? (
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
              {!isLoggedIn ? (loggingIn ? '登录中…' : '登录后可完善个人资料') : null}
              {isLoggedIn && user?.gender ? (user.gender === 'female' ? '♀' : '♂') : ''}
              {isLoggedIn && user?.age ? ` ${user.age}岁` : ''}
              {isLoggedIn && interestLabels ? ` · ${interestLabels}` : ''}
            </Text>
            {isLoggedIn && <Text className={styles.wechatRow}>
              微信号：{user?.wechatId ? <Text className={styles.wechatId}>{user.wechatId}</Text> : (
                <Text className={styles.wechatEmpty}>未填写（发布前需填写）</Text>
              )}
            </Text>}
          </View>
          <Text className={styles.editIcon}>›</Text>
        </View>

        {isLoggedIn && (!user?.avatar || !user?.nickname) && (
          <View className={styles.wechatProfileCard}>
            <Text className={styles.wechatProfileHint}>选择微信头像和昵称，其他资料可稍后手动完善</Text>
            {!user?.avatar && (
              <Button className={styles.wechatAvatarButton} openType='chooseAvatar' onChooseAvatar={handleChooseWxAvatar}>
                选择微信头像
              </Button>
            )}
            {!user?.nickname && (
              <View className={styles.nicknameRow}>
                <Input
                  className={styles.nicknameInput}
                  type='nickname'
                  value={wxNickname}
                  maxlength={20}
                  placeholder='点击填入微信昵称'
                  onInput={(e) => setWxNickname(e.detail.value)}
                />
                <Button className={styles.nicknameSave} disabled={!wxNickname.trim() || savingProfile} onClick={handleSaveNickname}>保存</Button>
              </View>
            )}
          </View>
        )}

        {/* 入口列表 */}
        <View className={styles.menuCard}>
          {isLoggedIn && <View className={styles.menuItem} onClick={goToMessages}>
            <Text className={`iconfont icon-flash-outfitmessage ${styles.menuIcon}`} />
            <Text className={styles.menuLabel}>消息</Text>
            {unreadCount > 0 && (
              <View className={styles.unreadBadge}>
                <Text className={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
            <Text className={styles.menuArrow}>›</Text>
          </View>}
          {isLoggedIn && <View className={styles.menuDivider} />}
          {isLoggedIn && <View className={styles.menuItem} onClick={goToMyRequests}>
            <Text className={`iconfont icon-flash-outfitpublish ${styles.menuIcon}`} />
            <Text className={styles.menuLabel}>我发布的活动</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>}
          {isLoggedIn && <View className={styles.menuDivider} />}
          {isLoggedIn && <View className={styles.menuItem} onClick={goToMyApplications}>
            <Text className={`iconfont icon-flash-outfitPartnerPreference ${styles.menuIcon}`} />
            <Text className={styles.menuLabel}>我的申请</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>}
          {isLoggedIn && <View className={styles.menuDivider} />}
          <View className={styles.menuItem} onClick={goToCommunityRules}>
            <Text className={`iconfont icon-flash-outfitcalendar ${styles.menuIcon}`} />
            <Text className={styles.menuLabel}>社区公约</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>

        {/* 退出登录 */}
        {isLoggedIn && <View className={styles.menuCard}>
          <View className={styles.menuItem} onClick={handleLogout}>
            <Text className={`iconfont icon-flash-outfitmine ${styles.menuIcon}`} />
            <Text className={styles.menuLabel}>退出登录</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>}

        <CustomTabBar />
      </View>
    </PageLayout>
  );
}
