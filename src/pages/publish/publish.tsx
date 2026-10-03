import { useRef } from 'react';
import { View, Text, Textarea, Button, Switch } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
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
    destinationRegion,
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
    setDestinationRegion,
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
  // 手动选择地区后使进行中的自动定位失效，防止旧坐标覆盖用户选择。
  const locationRequestId = useRef(0);

  useDidShow(() => {
    setSelectedTab(1);
    if (!usePublishStore.getState().selectedTime) {
      // 选择器精度为分钟，向上取整到最接近此刻的可发布时刻。
      const now = new Date();
      now.setSeconds(0, 0);
      now.setMinutes(now.getMinutes() + 1);
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setSelectedTime({ date, time });
    }
  });

  /** 不满足条件的字段 → 对应表单区域节点 id */
  const FIELD_SECTION_IDS: Record<string, string> = {
    activityType: 'section-activityType',
    activityTime: 'section-activityTime',
    destination: 'section-location',
    description: 'section-description',
    images: 'section-photos',
  };

  // 滚动到不满足条件的表单区域
  const scrollToSection = (field?: string) => {
    const id = field ? FIELD_SECTION_IDS[field] : undefined;
    if (!id) return;
    Taro.nextTick(() => {
      const query = Taro.createSelectorQuery();
      query.select(`#${id}`).boundingClientRect();
      query.selectViewport().scrollOffset();
      query.exec((res) => {
        const rect = res?.[0] as { top: number } | null;
        const scroll = res?.[1] as { scrollTop: number } | null;
        if (rect && scroll) {
          Taro.pageScrollTo({
            scrollTop: Math.max(scroll.scrollTop + rect.top - 140, 0),
            duration: 300,
          });
        }
      });
    });
  };

  // 自动定位需要坐标和规范市名；缺少地图 key 或逆地理失败时改为手动选地区。
  const handleRefreshLocation = async () => {
    const requestId = ++locationRequestId.current;
    try {
      const res = await Taro.getLocation({ type: 'gcj02' });
      const geo = await reverseGeo(res.latitude, res.longitude);
      if (requestId !== locationRequestId.current) return;
      if (!geo.city) throw new Error('无法识别所在地区');
      setCurrentLocation({
        name: [geo.province, geo.city, geo.district].filter(Boolean).join(''),
        city: geo.city,
        region: geo.province && geo.district ? [geo.province, geo.city, geo.district] : undefined,
        latitude: res.latitude,
        longitude: res.longitude,
      });
    } catch {
      if (requestId !== locationRequestId.current) return;
      Taro.showToast({ title: '自动定位不可用，请手动选择所在地区', icon: 'none' });
    }
  };

  const handleCurrentRegionChange = (region: [string, string, string]) => {
    locationRequestId.current += 1;
    setCurrentLocation({ name: region.join(''), city: region[1], region });
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
    if (state.isSubmitting) return;
    const validation = state.validateForm();

    if (!validation.valid) {
      Taro.showToast({ title: validation.message || '请完善表单信息', icon: 'none' });
      scrollToSection(validation.field);
      return;
    }

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

    setIsSubmitting(true);
    try {
      const isoTime = new Date(
        `${selectedTime!.date}T${selectedTime!.time}:00+08:00`,
      ).toISOString();

      await createRequest({
        type: activityType!,
        activityTime: isoTime,
        destination: destination.trim(),
        location: {
          lat: currentLocation?.latitude ?? null,
          lng: currentLocation?.longitude ?? null,
          city: currentLocation!.city,
        },
        genderPreference: gender,
        ageRange,
        description,
        photos: images,
        maxMembers,
        autoCloseOnGrouped,
      });

      // 先审后展：图片异步审核通过后才会进首页流，统一提示待审核
      Taro.showToast({
        title: '发布成功，待通过审核后展示',
        icon: 'none',
        duration: 2500,
      });
      resetForm();
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/home/home' });
      }, 2000);
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

  const descriptionLength = description.trim().length;
  const canSubmit =
    activityType &&
    selectedTime &&
    currentLocation?.city &&
    destinationRegion &&
    descriptionLength >= 10 &&
    images.length > 0 &&
    !isSubmitting;

  return (
    <View className={styles.page}>
      {/* 标题栏 */}
      <HeaderBar title='发布请求' showBack showHelp={false} />

      {/* 表单内容 */}
      <View className={styles.content}>
        {/* 活动类型 */}
        <View id='section-activityType'>
          <FormSection title={FORM_LABELS.activityType} icon='icon-flash-outfitActivityType' required>
            <ActivityTypeSelector value={activityType} onChange={setActivityType} />
          </FormSection>
        </View>

        {/* 活动时间 */}
        <View id='section-activityTime'>
          <FormSection title={FORM_LABELS.activityTime} icon='icon-flash-outfitcalendar' required>
            <TimePicker value={selectedTime} onChange={setSelectedTime} />
          </FormSection>
        </View>

        {/* 活动地点 */}
        <View id='section-location'>
          <FormSection title={FORM_LABELS.activityLocation} icon='icon-flash-outfitPositionIcon' required>
            <LocationSelector
              currentLocation={currentLocation}
              destinationRegion={destinationRegion}
              onRefreshLocation={handleRefreshLocation}
              onCurrentRegionChange={handleCurrentRegionChange}
              onDestinationRegionChange={setDestinationRegion}
            />
          </FormSection>
        </View>

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
        <View id='section-description'>
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
              <Text className={`${styles.descriptionHint} ${description.length > 0 && descriptionLength < 10 ? styles.descriptionHintError : ''}`}>
                {description.length > 0 && descriptionLength < 10
                  ? `还需输入 ${10 - descriptionLength} 字（至少 10 字）`
                  : '至少 10 字，最多 500 字'}
              </Text>
              <Text className={styles.countText}>{descriptionLength}/500 字</Text>
            </View>
          </FormSection>
        </View>

        {/* 活动照片 */}
        <View id='section-photos'>
          <FormSection title={FORM_LABELS.activityPhotos} icon='icon-flash-outfitUploadPhoto' required>
            <ImageUploader images={images} onAdd={handleAddImages} onRemove={removeImage} />
          </FormSection>
        </View>

        {/* 提交按钮 */}
        <View className={styles.submitSection}>
          <Button
            className={`${styles.submitBtn} ${!canSubmit ? styles.disabled : ''}`}
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
