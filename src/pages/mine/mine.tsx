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
  const [showWechatProfile, setShowWechatProfile] = useState(false);
  const [wxAvatar, setWxAvatar] = useState('');
  const [wxNickname, setWxNickname] = useState('');
  const [nicknameFocused, setNicknameFocused] = useState(false);
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

  const openWechatProfile = () => {
    setWxAvatar('');
    setWxNickname(useUserStore.getState().user?.nickname || '');
    setNicknameFocused(false);
    setShowWechatProfile(true);
  };

  const closeWechatProfile = () => {
    if (savingProfile) return;
    setShowWechatProfile(false);
    setNicknameFocused(false);
    setWxAvatar('');
  };

  // wx.login 仅用于身份认证；微信头像和昵称由用户在同一流程中确认。
  const handleProfileClick = async () => {
    if (isLoggedIn) {
      goToEdit();
      return;
    }
    if (loggingIn) return;
    setLoggingIn(true);
    try {
      await loginWithWechat();
      refreshUnread();
      openWechatProfile();
    } catch (e) {
      const error = e as { message?: string };
      Taro.showToast({ title: error.message || '登录失败，请重试', icon: 'none' });
    } finally {
      setLoggingIn(false);
    }
  };

  const handleChooseWxAvatar = (e: { detail: { avatarUrl: string } }) => {
    if (e.detail.avatarUrl) setWxAvatar(e.detail.avatarUrl);
  };

  const handleSaveWechatProfile = async () => {
    const nickname = wxNickname.trim();
    if (!wxAvatar && !user?.avatar) {
      Taro.showToast({ title: '请先选择微信头像', icon: 'none' });
      return;
    }
    if (!nickname) {
      Taro.showToast({ title: '请填写微信昵称', icon: 'none' });
      return;
    }
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      const avatar = wxAvatar ? await uploadImage(wxAvatar) : user?.avatar;
      await patchUser({ avatar, nickname });
      setShowWechatProfile(false);
      setWxAvatar('');
      Taro.showToast({ title: '微信资料已保存', icon: 'success' });
    } catch (e) {
      const error = e as { message?: string };
      Taro.showToast({ title: error.message || '保存失败，请重试', icon: 'none' });
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
          setShowWechatProfile(false);
          setNicknameFocused(false);
          setWxAvatar('');
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
              <Text className={styles.name}>{!isLoggedIn ? '点击头像微信登录' : user?.nickname || '未设置昵称'}</Text>
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
          <View className={styles.wechatProfileCard} onClick={openWechatProfile}>
            <Text className={styles.wechatProfileTitle}>完善微信资料</Text>
            <Text className={styles.wechatProfileHint}>选择头像和昵称后统一保存，其他资料可稍后填写</Text>
            <Text className={styles.menuArrow}>›</Text>
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

        {showWechatProfile && isLoggedIn && (
          <View className={styles.wechatProfileMask} onClick={closeWechatProfile}>
            <View className={styles.wechatProfileSheet} onClick={(e) => e.stopPropagation()}>
              <Text className={styles.sheetTitle}>完善微信资料</Text>
              {!nicknameFocused && (
                <View>
                  <Text className={styles.sheetHint}>选择微信头像与昵称，完成后一次保存</Text>
                  <Button className={styles.wechatAvatarButton} openType='chooseAvatar' onChooseAvatar={handleChooseWxAvatar}>
                    {wxAvatar ? '重新选择微信头像' : user?.avatar ? '更换微信头像' : '选择微信头像'}
                  </Button>
                  {(wxAvatar || user?.avatar) && (
                    <SmartImage key={wxAvatar || user?.avatar} className={styles.wxAvatarPreview} src={wxAvatar || user?.avatar || ''} mode='aspectFill' />
                  )}
                </View>
              )}
              <Text className={styles.nicknameLabel}>微信昵称</Text>
              {nicknameFocused && (
                <View className={styles.nicknameFocusGuide}>
                  <Text className={styles.nicknameFocusTitle}>
                    {wxNickname.trim() ? '昵称已填入' : '在屏幕最下方点「用微信昵称」'}
                  </Text>
                  <Text className={styles.nicknameFocusDetail}>
                    {wxNickname.trim() ? '收起键盘后，点击保存微信资料' : '这是微信弹出的候选项，点击即可自动填入昵称 ↓'}
                  </Text>
                </View>
              )}
              <View className={styles.nicknameField}>
                <Input
                  className={styles.nicknameInput}
                  type='nickname'
                  value={wxNickname}
                  maxlength={20}
                  placeholder='点击后在底部选「用微信昵称」'
                  onFocus={() => setNicknameFocused(true)}
                  onBlur={() => setNicknameFocused(false)}
                  onInput={(e) => setWxNickname(e.detail.value)}
                />
                <Text className={styles.nicknameArrow}>›</Text>
              </View>
              {!nicknameFocused && (
                <View>
                  <Text className={styles.nicknameHint}>点击输入框后，在屏幕底部选择「用微信昵称」；也可以手动输入</Text>
                  <View className={styles.sheetActions}>
                    <Button className={styles.cancelButton} disabled={savingProfile} onClick={closeWechatProfile}>稍后再说</Button>
                    <Button className={styles.nicknameSave} loading={savingProfile} disabled={savingProfile} onClick={handleSaveWechatProfile}>保存微信资料</Button>
                  </View>
                  <Text className={styles.sheetHint}>性别、出生年份等信息可在“编辑资料”中手动填写</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </PageLayout>
  );
}
