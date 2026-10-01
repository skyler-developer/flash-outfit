import { useState } from 'react';
import { View, Text, Textarea, Button, Switch } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useTabsStore } from '@/stores/tabsStore/useTabsStore';
import { usePublishStore } from '@/stores/publishStore/usePublishStore';
import { useUserStore } from '@/stores/userStore/useUserStore';
import HeaderBar from '@/components/headerBar';
import FormSection from '@/components/formSection';
import ActivityTypeSelector from '@/components/activityTypeSelector';
import TimePicker from '@/components/timePicker';
import LocationSelector from '@/components/locationSelector';
import PartnerPreference from '@/components/partnerPreference';
import ImageUploader from '@/components/imageUploader';
import { createRequest } from '@/api/requestApi';
import { uploadImage, reverseGeo } from '@/api/upload';
import { FORM_LABELS } from './constants';
import styles from './publish.module.scss';

export default function Publish() {
  const { setSelectedTab } = useTabsStore();

  const {
    activityType,
    selectedTime,
    currentLocation,
    destination,
    gender,
    ageRange,
    description,
    images,
    isSubmitting,
    maxMembers,
    autoCloseOnGrouped,
    setActivityType,
    setSelectedTime,
    setCurrentLocation,
    setDestination,
    setGender,
    setAgeRange,
    setDescription,
    addImages,
    removeImage,
    setMaxMembers,
    setAutoCloseOnGrouped,
    resetForm,
    setIsSubmitting,
  } = usePublishStore();

  const user = useUserStore((s) => s.user);
  const refreshUser = useUserStore((s) => s.refreshUser);
  /** 定位失败降级：手动填写的城市（无坐标） */
  const [manualCity, setManualCity] = useState('');

  useLoad(() => {
    setSelectedTab(2);
  });

  // 获取当前位置（真实逆地理编码）
  const handleRefreshLocation = async () => {
    try {
      const res = await Taro.getLocation({ type: 'gcj02' });
      let name = '当前位置';
      try {
        const geo = await reverseGeo(res.latitude, res.longitude);
        name = [geo.city, geo.district].filter(Boolean).join('') || '当前位置';
      } catch {
        // 逆地理失败不影响坐标采集
      }
      setCurrentLocation({
        name,
        latitude: res.latitude,
        longitude: res.longitude,
      });
    } catch (error) {
      console.error('获取位置失败', error);
      Taro.showToast({ title: '获取位置失败，请检查定位授权', icon: 'none' });
    }
  };

  // 图片选择后逐张上传（imageUploader 回调传入临时路径）
  const handleAddImages = async (tempPaths: string[]) => {
    Taro.showLoading({ title: '上传图片中' });
    try {
      const urls: string[] = [];
      for (const p of tempPaths) {
        try {
          urls.push(await uploadImage(p));
        } catch (e) {
          const err = e as { message?: string };
          Taro.showToast({ title: err.message || '部分图片上传失败', icon: 'none' });
        }
      }
      if (urls.length) addImages(urls);
    } finally {
      Taro.hideLoading();
    }
  };

  // 提交发布
  const handleSubmit = async () => {
    const state = usePublishStore.getState();
    const validation = state.validateForm();

    // 微信号强校验（成组刚需）
    if (!user?.wechatId) {
      Taro.showModal({
        title: '需要微信号',
        content: '搭子成组后需要互加微信联系，发布前请先填写你的微信号',
        confirmText: '去填写',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/profileEdit/profileEdit?from=publish' });
          }
        },
      });
      return;
    }

    if (!validation.valid) {
      Taro.showToast({ title: validation.message || '请完善表单信息', icon: 'none' });
      return;
    }

    // 定位兜底：未授权时再尝试一次；失败降级为手动城市（不阻断发布）
    let lat = currentLocation?.latitude ?? null;
    let lng = currentLocation?.longitude ?? null;
    let city = currentLocation?.name || manualCity || '';
    if ((lat == null || lng == null) && !city) {
      try {
        const res = await Taro.getLocation({ type: 'gcj02' });
        lat = res.latitude;
        lng = res.longitude;
      } catch {
        Taro.showToast({ title: '请授权定位，或手动输入所在城市', icon: 'none' });
        return;
      }
    }
    if (!city) city = '未知城市';

    setIsSubmitting(true);
    try {
      const isoTime = new Date(
        `${selectedTime!.date}T${selectedTime!.time}:00+08:00`,
      ).toISOString();

      await createRequest({
        type: activityType!,
        activityTime: isoTime,
        destination: destination.trim(),
        location: { lat, lng, city },
        genderPreference: gender,
        ageRange,
        description,
        photos: images,
        maxMembers,
        autoCloseOnGrouped,
      });

      Taro.showToast({ title: '发布成功', icon: 'success' });
      resetForm();
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/home/home' });
      }, 1200);
    } catch (e) {
      const err = e as { message?: string };
      // 微信号校验兜底（token 内用户资料可能过期）
      if ((e as { code?: number }).code === 4100) {
        refreshUser();
        Taro.showToast({ title: '请先在“我的”中填写微信号', icon: 'none' });
      } else {
        Taro.showToast({ title: err.message || '发布失败，请重试', icon: 'none' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    activityType &&
    selectedTime &&
    destination.trim() &&
    description.length >= 10 &&
    images.length > 0 &&
    !isSubmitting;

  return (
    <View className={styles.page}>
      {/* 标题栏 */}
      <HeaderBar title='发布请求' showClose showHelp />

      {/* 表单内容 */}
      <View className={styles.content}>
        {/* 活动类型 */}
        <FormSection title={FORM_LABELS.activityType} icon='icon-flash-outfitActivityType' required>
          <ActivityTypeSelector value={activityType} onChange={setActivityType} />
        </FormSection>

        {/* 活动时间 */}
        <FormSection title={FORM_LABELS.activityTime} icon='icon-flash-outfitcalendar' required>
          <TimePicker value={selectedTime} onChange={setSelectedTime} />
        </FormSection>

        {/* 活动地点 */}
        <FormSection title={FORM_LABELS.activityLocation} icon='icon-flash-outfitPositionIcon' required>
          <LocationSelector
            currentLocation={currentLocation}
            destination={destination}
            onRefreshLocation={handleRefreshLocation}
            onDestinationChange={setDestination}
            onManualCity={setManualCity}
          />
        </FormSection>

        {/* 伙伴偏好 */}
        <FormSection title={FORM_LABELS.partnerPreference} icon='icon-flash-outfitPartnerPreference'>
          <PartnerPreference
            gender={gender}
            ageRange={ageRange}
            onGenderChange={setGender}
            onAgeRangeChange={setAgeRange}
          />
        </FormSection>

        {/* 成组设置（v1.1 新增字段） */}
        <FormSection title='成组设置' icon='icon-flash-outfitPartnerPreference'>
          <View className={styles.memberRow}>
            <Text className={styles.memberLabel}>搭子人数上限</Text>
            <View className={styles.stepper}>
              <View
                className={`${styles.stepBtn} ${maxMembers <= 1 ? styles.stepDisabled : ''}`}
                onClick={() => maxMembers > 1 && setMaxMembers(maxMembers - 1)}
              >
                <Text className={styles.stepIcon}>−</Text>
              </View>
              <Text className={styles.memberValue}>{maxMembers}</Text>
              <View
                className={`${styles.stepBtn} ${maxMembers >= 9 ? styles.stepDisabled : ''}`}
                onClick={() => maxMembers < 9 && setMaxMembers(maxMembers + 1)}
              >
                <Text className={styles.stepIcon}>+</Text>
              </View>
            </View>
          </View>
          <View className={styles.memberRow}>
            <View className={styles.switchLabelWrap}>
              <Text className={styles.memberLabel}>成组后自动结束招募</Text>
              <Text className={styles.switchHint}>关闭后成组仍继续招募，直到满员或手动结束</Text>
            </View>
            <Switch
              checked={autoCloseOnGrouped}
              color='#F49D25'
              onChange={(e) => setAutoCloseOnGrouped(e.detail.value)}
            />
          </View>
        </FormSection>

        {/* 活动描述 */}
        <FormSection title={FORM_LABELS.activityDescription} icon='icon-flash-outfitdescription' required>
          <Textarea
            className={styles.textarea}
            placeholder='描述一下你的活动计划、对伙伴的要求等...'
            placeholderClass={styles.placeholder}
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
            autoHeight
          />
          <View className={styles.textareaCount}>
            <Text className={styles.countText}>{description.length}/500</Text>
          </View>
        </FormSection>

        {/* 活动照片 */}
        <FormSection title={FORM_LABELS.activityPhotos} icon='icon-flash-outfitUploadPhoto' required>
          <ImageUploader images={images} onAdd={handleAddImages} onRemove={removeImage} />
        </FormSection>

        {/* 提交按钮 */}
        <View className={styles.submitSection}>
          <Button
            className={`${styles.submitBtn} ${!canSubmit ? styles.disabled : ''}`}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <View className={`iconfont icon-flash-outfitLittleRocket ${styles.submitBtnIcon}`}></View>
            <Text className={styles.submitBtnText}>发布请求</Text>
          </Button>
          <Text className={styles.submitTip}>发布请求即代表您已同意社区公约</Text>
        </View>
      </View>
    </View>
  );
}
