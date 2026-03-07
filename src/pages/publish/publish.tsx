import { View, Text, Textarea, Button } from '@tarojs/components';
import { useLoad } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import CustomTabBar from '@/customTabBar';
import { useTabsStore } from '@/stores/tabsStore/useTabsStore';
import { usePublishStore } from '@/stores/publishStore/usePublishStore';
import HeaderBar from '@/components/headerBar';
import FormSection from '@/components/formSection';
import ActivityTypeSelector from '@/components/activityTypeSelector';
import TimePicker from '@/components/timePicker';
import LocationSelector from '@/components/locationSelector';
import PartnerPreference from '@/components/partnerPreference';
import ImageUploader from '@/components/imageUploader';
import { FORM_LABELS } from './constants';
import styles from './publish.module.scss';

export default function Publish() {
  const { setSelectedTab } = useTabsStore();

  // 从 store 获取状态和方法
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
    setActivityType,
    setSelectedTime,
    setCurrentLocation,
    setDestination,
    setGender,
    setAgeRange,
    setDescription,
    addImages,
    removeImage,
    submitForm,
  } = usePublishStore();

  useLoad(() => {
    setSelectedTab(2);
  });

  // 获取当前位置
  const handleRefreshLocation = async () => {
    try {
      const res = await Taro.getLocation({ type: 'gcj02' });
      // TODO: 调用逆地理编码接口获取城市名
      setCurrentLocation({
        name: '上海', // 占位
        latitude: res.latitude,
        longitude: res.longitude,
      });
    } catch (error) {
      console.error('获取位置失败', error);
    }
  };

  // 发布按钮点击
  const handleSubmit = async () => {
    await submitForm();
  };

  // 表单是否可提交
  const canSubmit = activityType && selectedTime && destination.trim() && description.length >= 10 && images.length > 0 && !isSubmitting;

  return (
    <View className={styles.page}>
      {/* 标题栏 */}
      <HeaderBar title="发布活动" showClose showHelp />

      {/* 表单内容 */}
      <View className={styles.content}>
        {/* 活动类型 */}
        <FormSection title={FORM_LABELS.activityType} icon="📌" required>
          <ActivityTypeSelector value={activityType} onChange={setActivityType} />
        </FormSection>

        {/* 活动时间 */}
        <FormSection title={FORM_LABELS.activityTime} icon="📅" required>
          <TimePicker value={selectedTime} onChange={setSelectedTime} />
        </FormSection>

        {/* 活动地点 */}
        <FormSection title={FORM_LABELS.activityLocation} icon="📍" required>
          <LocationSelector
            currentLocation={currentLocation}
            destination={destination}
            onRefreshLocation={handleRefreshLocation}
            onDestinationChange={setDestination}
          />
        </FormSection>

        {/* 伙伴偏好 */}
        <FormSection title={FORM_LABELS.partnerPreference} icon="👥">
          <PartnerPreference
            gender={gender}
            ageRange={ageRange}
            onGenderChange={setGender}
            onAgeRangeChange={setAgeRange}
          />
        </FormSection>

        {/* 活动描述 */}
        <FormSection title={FORM_LABELS.activityDescription} icon="📝" required>
          <Textarea
            className={styles.textarea}
            placeholder="描述一下你的活动计划、对伙伴的要求等..."
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
        <FormSection title={FORM_LABELS.activityPhotos} icon="📷" required>
          <ImageUploader
            images={images}
            onAdd={addImages}
            onRemove={removeImage}
          />
        </FormSection>

        {/* 提交按钮 */}
        <View className={styles.submitSection}>
          <Button
            className={`${styles.submitBtn} ${!canSubmit ? styles.disabled : ''}`}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Text className={styles.submitBtnIcon}>🚀</Text>
            <Text className={styles.submitBtnText}>发布请求</Text>
          </Button>
          <Text className={styles.submitTip}>发布请求即代表您已同意社区公约</Text>
        </View>
      </View>

      {/* 底部 TabBar */}
      {/* <CustomTabBar /> */}
    </View>
  );
}
