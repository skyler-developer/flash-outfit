import { useState } from 'react';
import Taro, { useLoad, useRouter } from '@tarojs/taro';
import { ScrollView, Text, View, Image, Button, Input, Picker } from '@tarojs/components';
import PageLayout from '@/components/pageLayout';
import { useUserStore } from '@/stores/userStore/useUserStore';
import { uploadImage } from '@/api/upload';
import { ACTIVITY_TYPES } from '@/pages/publish/constants';
import type { UserInfo } from '@/api/auth';
import styles from './profileEdit.module.scss';

/** 出生年份范围：18~60 岁 */
function buildYearRange(): string[] {
  const now = new Date().getFullYear();
  const years: string[] = [];
  for (let y = now - 18; y >= now - 60; y--) years.push(`${y}`);
  return years;
}
const YEAR_RANGE = buildYearRange();

export default function ProfileEdit() {
  const router = useRouter();
  const from = router.params.from as string | undefined;
  const requestId = router.params.requestId as string | undefined;

  const patchUser = useUserStore((s) => s.patchUser);

  const [avatar, setAvatar] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [gender, setGender] = useState<'female' | 'male' | ''>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [wechatId, setWechatId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useLoad(() => {
    const u = useUserStore.getState().user;
    if (u) fillFrom(u);
  });

  const fillFrom = (u: UserInfo) => {
    setAvatar(u.avatar || '');
    setNickname(u.nickname || '');
    setGender(u.gender || '');
    setBirthYear(u.birthYear ? `${u.birthYear}` : '');
    setInterests(u.interests || []);
    setWechatId(u.wechatId || '');
    setInitialized(true);
  };

  /** 微信官方「头像填充」：open-type=chooseAvatar，用户确认后返回临时文件，上传后存 URL */
  const handleChooseWxAvatar = async (e: { detail: { avatarUrl: string } }) => {
    const tempPath = e.detail.avatarUrl;
    if (!tempPath) return;
    try {
      Taro.showLoading({ title: '上传中…', mask: true });
      const url = await uploadImage(tempPath);
      setAvatar(url);
      Taro.hideLoading();
      Taro.showToast({ title: '头像已更新', icon: 'none' });
    } catch (err) {
      Taro.hideLoading();
      const error = err as { message?: string };
      Taro.showToast({ title: error.message || '上传失败', icon: 'none' });
    }
  };

  /** 兜底：从相册选图作为头像 */
  const handleChooseAvatar = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] });
      const filePath = res.tempFilePaths[0];
      Taro.showLoading({ title: '上传中…', mask: true });
      const url = await uploadImage(filePath);
      setAvatar(url);
      Taro.hideLoading();
    } catch (e) {
      Taro.hideLoading();
      const err = e as { message?: string };
      Taro.showToast({ title: err.message || '上传失败', icon: 'none' });
    }
  };

  const toggleInterest = (type: string) => {
    setInterests((prev) =>
      prev.includes(type) ? prev.filter((i) => i !== type) : [...prev, type],
    );
  };

  const handleSave = async () => {
    if (!gender) {
      Taro.showToast({ title: '请选择性别', icon: 'none' });
      return;
    }
    if (!birthYear) {
      Taro.showToast({ title: '请选择出生年份', icon: 'none' });
      return;
    }
    const wechat = wechatId.trim();
    if (wechat && !/^[\w-]{2,30}$/.test(wechat)) {
      Taro.showToast({ title: '微信号格式不正确', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      await patchUser({
        nickname: nickname.trim() || undefined,
        avatar: avatar || undefined,
        gender,
        birthYear: Number(birthYear),
        interests,
        wechatId: wechat || undefined,
      });
      Taro.showToast({ title: '已保存', icon: 'success' });
      // 从申请流程进入：保存后回到详情页继续申请
      if (from === 'apply' && requestId) {
        setTimeout(() => {
          Taro.redirectTo({ url: `/pages/detail/detail?id=${requestId}` });
        }, 600);
      } else {
        setTimeout(() => Taro.navigateBack(), 600);
      }
    } catch (e) {
      const err = e as { message?: string };
      Taro.showToast({ title: err.message || '保存失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <View className={styles.page}>
        <View className={styles.header}>
          <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
            <Text className={styles.backIcon}>‹</Text>
          </View>
          <Text className={styles.headerTitle}>
            {from === 'apply' && !initialized ? '完善资料' : '编辑资料'}
          </Text>
        </View>

        <ScrollView scrollY className={styles.body}>
          {/* 头像 + 昵称 */}
          <View className={styles.card}>
            <View className={styles.row}>
              <Text className={styles.label}>头像</Text>
              <View className={styles.avatarBtns}>
                {/* 微信官方能力：一键填充微信头像（基础库 ≥ 2.21.2） */}
                <Button
                  className={styles.wxAvatarBtn}
                  openType='chooseAvatar'
                  onChooseAvatar={handleChooseWxAvatar}
                >
                  <Text className={styles.wxAvatarBtnText}>微信头像</Text>
                </Button>
                <Button className={styles.localAvatarBtn} onClick={handleChooseAvatar}>
                  <Text className={styles.localAvatarBtnText}>相册选图</Text>
                </Button>
                {avatar ? (
                  <Image className={styles.avatar} src={avatar} mode='aspectFill' />
                ) : (
                  <View className={`${styles.avatar} ${styles.avatarFallback}`}>
                    <Text className={styles.avatarPlus}>+</Text>
                  </View>
                )}
              </View>
            </View>
            <View className={styles.row}>
              <Text className={styles.label}>昵称</Text>
              <Input
                className={styles.input}
                type='nickname'
                value={nickname}
                onInput={(e) => setNickname(e.detail.value)}
                placeholder='点击可快速填入微信昵称'
                placeholderClass={styles.placeholder}
                maxlength={20}
              />
            </View>
          </View>

          {/* 基本资料 */}
          <View className={styles.card}>
            <Text className={styles.cardTitle}>基本资料<Text className={styles.required}>*</Text></Text>
            <View className={styles.row}>
              <Text className={styles.label}>性别</Text>
              <View className={styles.genderRow}>
                {(['female', 'male'] as const).map((g) => (
                  <View
                    key={g}
                    className={`${styles.genderOption} ${gender === g ? styles.genderActive : ''}`}
                    onClick={() => setGender(g)}
                  >
                    <Text className={styles.genderText}>{g === 'female' ? '女' : '男'}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.row}>
              <Text className={styles.label}>出生年份</Text>
              <Picker
                mode='selector'
                range={YEAR_RANGE}
                value={birthYear ? YEAR_RANGE.indexOf(birthYear) : 0}
                onChange={(e) => setBirthYear(YEAR_RANGE[Number(e.detail.value)])}
              >
                <View className={styles.pickerValue}>
                  <Text className={styles.pickerText}>{birthYear || '请选择'}</Text>
                  <Text className={styles.arrow}>›</Text>
                </View>
              </Picker>
            </View>
          </View>

          {/* 兴趣标签 */}
          <View className={styles.card}>
            <Text className={styles.cardTitle}>我的兴趣</Text>
            <View className={styles.interestGrid}>
              {ACTIVITY_TYPES.map((t) => (
                <View
                  key={t.type}
                  className={`${styles.interestItem} ${
                    interests.includes(t.type) ? styles.interestActive : ''
                  }`}
                  onClick={() => toggleInterest(t.type)}
                >
                  <Text
                    className={`${styles.interestText} ${
                      interests.includes(t.type) ? styles.interestActiveText : ''
                    }`}
                  >
                    {t.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 微信号 */}
          <View className={styles.card}>
            <Text className={styles.cardTitle}>微信号</Text>
            <Input
              className={styles.wechatInput}
              value={wechatId}
              onInput={(e) => setWechatId(e.detail.value)}
              placeholder='选填；发布请求前必须填写，成组后互相可见'
              placeholderClass={styles.placeholder}
              maxlength={30}
            />
          </View>

          <Button className={styles.saveBtn} loading={submitting} disabled={submitting} onClick={handleSave}>
            <Text className={styles.saveBtnText}>保存</Text>
          </Button>

          <View className={styles.bottomSpace} />
        </ScrollView>
      </View>
    </PageLayout>
  );
}
