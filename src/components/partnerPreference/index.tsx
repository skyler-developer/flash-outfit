import { View, Text, Slider } from '@tarojs/components';
import type { GenderType } from '@/pages/publish/constants';
import { GENDER_OPTIONS, AGE_RANGE } from '@/pages/publish/constants';
import styles from './partnerPreference.module.scss';

export interface PartnerPreferenceProps {
  gender: GenderType;
  ageRange: [number, number];
  onGenderChange: (gender: GenderType) => void;
  onAgeRangeChange: (range: [number, number]) => void;
}

export default function PartnerPreference({
  gender,
  ageRange,
  onGenderChange,
  onAgeRangeChange,
}: PartnerPreferenceProps) {
  // 性别选择
  const handleGenderClick = (type: GenderType) => {
    onGenderChange(type);
  };

  // 最小年龄滑块变化
  const handleMinAgeChange = (e) => {
    const minAge = e.detail.value;
    if (minAge <= ageRange[1]) {
      onAgeRangeChange([minAge, ageRange[1]]);
    }
  };

  // 最大年龄滑块变化
  const handleMaxAgeChange = (e) => {
    const maxAge = e.detail.value;
    if (maxAge >= ageRange[0]) {
      onAgeRangeChange([ageRange[0], maxAge]);
    }
  };

  return (
    <View className={styles.container}>
      {/* 性别偏好 */}
      <View className={styles.section}>
        <Text className={styles.sectionLabel}>性别偏好</Text>
        <View className={styles.genderTabs}>
          {GENDER_OPTIONS.map((option) => (
            <View
              key={option.type}
              className={`${styles.genderTab} ${gender === option.type ? styles.active : ''}`}
              onClick={() => handleGenderClick(option.type)}
            >
              <Text className={styles.genderTabText}>{option.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 年龄范围 */}
      <View className={styles.section}>
        <View className={styles.ageHeader}>
          <Text className={styles.sectionLabel}>年龄范围</Text>
          <Text className={styles.ageValue}>
            {ageRange[0]} - {ageRange[1]}岁
          </Text>
        </View>
        <View className={styles.sliderContainer}>
          <View className={styles.sliderItem}>
            <Text className={styles.sliderLabel}>最小</Text>
            <Slider
              className={styles.slider}
              min={AGE_RANGE.min}
              max={AGE_RANGE.max}
              value={ageRange[0]}
              activeColor="#F49D25"
              backgroundColor="#f0f0f0"
              blockSize={20}
              onChanging={handleMinAgeChange}
              onChange={handleMinAgeChange}
            />
          </View>
          <View className={styles.sliderItem}>
            <Text className={styles.sliderLabel}>最大</Text>
            <Slider
              className={styles.slider}
              min={AGE_RANGE.min}
              max={AGE_RANGE.max}
              value={ageRange[1]}
              activeColor="#F49D25"
              backgroundColor="#f0f0f0"
              blockSize={20}
              onChanging={handleMaxAgeChange}
              onChange={handleMaxAgeChange}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
