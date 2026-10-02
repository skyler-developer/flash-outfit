import { View, Text, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { TimeSelection } from '@/pages/publish/constants';
import styles from './timePicker.module.scss';

export interface TimePickerProps {
  value: TimeSelection | null;
  onChange: (time: TimeSelection) => void;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalTime(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const today = formatLocalDate(new Date());

  // 日期选择
  const handleDateChange = (e: { detail: { value: string } }) => {
    const date = e.detail.value;
    onChange({
      date,
      time: value?.time || formatLocalTime(new Date()),
    });
  };

  // 时间选择
  const handleTimeChange = (e: { detail: { value: string } }) => {
    const time = e.detail.value;
    const date = value?.date || today;
    if (new Date(`${date}T${time}:00`).getTime() <= Date.now()) {
      Taro.showToast({ title: '请选择未来的活动时间', icon: 'none' });
      return;
    }
    onChange({
      date,
      time,
    });
  };

  // 格式化显示日期
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '选择日期';
    const [year, month, day] = dateStr.split('-');
    return `${year}年${month}月${day}日`;
  };

  return (
    <View>
      {/* 日期时间选择 */}
      <View className={styles.dateTimePicker}>
        <Picker
          className={styles.pickerItem}
          mode='date'
          value={value?.date || today}
          start={today}
          onChange={handleDateChange}
        >
          <Text className={styles.pickerLabel}>日期</Text>
          <View className={styles.pickerValue}>
            <Text className={styles.pickerValueText}>
              {value?.date ? formatDisplayDate(value.date) : '选择日期'}
            </Text>
            <Text className={styles.pickerArrow}>›</Text>
          </View>
        </Picker>

        <View className={styles.divider} />

        <Picker
          className={styles.pickerItem}
          mode='time'
          value={value?.time || formatLocalTime(new Date())}
          onChange={handleTimeChange}
        >
          <Text className={styles.pickerLabel}>时间</Text>
          <View className={styles.pickerValue}>
            <Text className={styles.pickerValueText}>
              {value?.time || '选择时间'}
            </Text>
            <Text className={styles.pickerArrow}>›</Text>
          </View>
        </Picker>
      </View>
    </View>
  );
}
