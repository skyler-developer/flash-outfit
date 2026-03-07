import { View, Text } from '@tarojs/components';
import styles from './formSection.module.scss';

export interface FormSectionProps {
  title: string;
  icon?: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function FormSection({
  title,
  icon,
  required = false,
  children,
}: FormSectionProps) {
  return (
    <View className={styles.formSection}>
      <View className={styles.header}>
        {icon && <View className={`iconfont ${icon} ${styles.icon}`}></View>}
        <Text className={styles.title}>
          {title}
          {required && <Text className={styles.required}>*</Text>}
        </Text>
      </View>
      <View className={styles.content}>{children}</View>
    </View>
  );
}
