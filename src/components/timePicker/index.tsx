import { View, Text, Picker } from '@tarojs/components';
import { useState, useMemo } from 'react';
import type { TimeSelection, QuickOptionType } from '@/pages/publish/constants';
import { QUICK_TIME_OPTIONS } from '@/pages/publish/constants';
import styles from './timePicker.module.scss';

export interface TimePickerProps {
  value: TimeSelection | null;
  onChange: (time: TimeSelection) => void;
}

// 获取本周末日期
function getWeekendDate(): { saturday: string; sunday: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const daysUntilSunday = (7 - dayOfWeek + 7) % 7 || 7;

  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);

  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    saturday: formatDate(saturday),
    sunday: formatDate(sunday),
  };
}

// 获取下周日期
function getNextWeekDate(): string {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const year = nextWeek.getFullYear();
  const month = String(nextWeek.getMonth() + 1).padStart(2, '0');
  const day = String(nextWeek.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取下个月日期
function getNextMonthDate(): string {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);
  const year = nextMonth.getFullYear();
  const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const day = String(nextMonth.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 根据快捷选项获取日期
function getDateByQuickOption(option: QuickOptionType): string {
  switch (option) {
    case 'weekend':
      return getWeekendDate().saturday;
    case 'nextWeek':
      return getNextWeekDate();
    case 'nextMonth':
      return getNextMonthDate();
    default:
      return '';
  }
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // 当前日期字符串
  const today = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 快捷选项点击
  const handleQuickOptionClick = (option: QuickOptionType) => {
    const date = getDateByQuickOption(option);
    onChange({
      date,
      time: value?.time || '09:00',
      quickOption: option,
    });
  };

  // 日期选择
  const handleDateChange = (e) => {
    const date = e.detail.value;
    onChange({
      date,
      time: value?.time || '09:00',
      quickOption: null,
    });
  };

  // 时间选择
  const handleTimeChange = (e) => {
    const time = e.detail.value;
    if (value) {
      onChange({
        ...value,
        time,
      });
    } else {
      onChange({
        date: today,
        time,
        quickOption: null,
      });
    }
  };

  // 显示日期选择器
  const handleShowDatePicker = () => {
    setShowDatePicker(true);
  };

  // 显示时间选择器
  const handleShowTimePicker = () => {
    setShowTimePicker(true);
  };

  // 格式化显示日期
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '选择日期';
    const [year, month, day] = dateStr.split('-');
    return `${month}月${day}日`;
  };

  return (
    <View className={styles.container}>
      {/* 快捷选项 */}
      <View className={styles.quickOptions}>
        {QUICK_TIME_OPTIONS.map((option) => (
          <View
            key={option.type}
            className={`${styles.quickOption} ${value?.quickOption === option.type ? styles.active : ''}`}
            onClick={() => handleQuickOptionClick(option.type)}
          >
            <Text className={styles.quickOptionText}>{option.label}</Text>
          </View>
        ))}
      </View>

      {/* 日期时间选择 */}
      <View className={styles.dateTimePicker}>
        <View className={styles.pickerItem} onClick={handleShowDatePicker}>
          <Text className={styles.pickerLabel}>日期</Text>
          <View className={styles.pickerValue}>
            <Text className={styles.pickerValueText}>
              {value?.date ? formatDisplayDate(value.date) : '选择日期'}
            </Text>
            <Text className={styles.pickerArrow}>›</Text>
          </View>
        </View>

        <View className={styles.divider} />

        <View className={styles.pickerItem} onClick={handleShowTimePicker}>
          <Text className={styles.pickerLabel}>时间</Text>
          <View className={styles.pickerValue}>
            <Text className={styles.pickerValueText}>
              {value?.time || '选择时间'}
            </Text>
            <Text className={styles.pickerArrow}>›</Text>
          </View>
        </View>
      </View>

      {/* 隐藏的 Picker 组件 */}
      {showDatePicker && (
        <Picker mode="date" value={value?.date || today} onChange={handleDateChange} start={today}>
          <View style={{ display: 'none' }} />
        </Picker>
      )}
      {showTimePicker && (
        <Picker mode="time" value={value?.time || '09:00'} onChange={handleTimeChange}>
          <View style={{ display: 'none' }} />
        </Picker>
      )}
    </View>
  );
}
