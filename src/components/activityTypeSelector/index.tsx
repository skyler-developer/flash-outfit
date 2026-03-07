import { View, Text } from '@tarojs/components';
import type { ActivityType } from '@/pages/publish/constants';
import { ACTIVITY_TYPES } from '@/pages/publish/constants';
import styles from './activityTypeSelector.module.scss';

export interface ActivityTypeSelectorProps {
  value: ActivityType | null;
  onChange: (type: ActivityType) => void;
}

export default function ActivityTypeSelector({
  value,
  onChange,
}: ActivityTypeSelectorProps) {
  return (
    <View className={styles.container}>
      {ACTIVITY_TYPES.map((item) => (
        <View
          key={item.type}
          className={`${styles.item} ${value === item.type ? styles.active : ''}`}
          onClick={() => onChange(item.type)}
        >
          <View className={styles.iconWrap}>
            <Text className={styles.iconText}>{item.icon}</Text>
          </View>
          <Text className={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
