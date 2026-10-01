import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import type { LocationInfo } from '@/stores/publishStore/usePublishStore';
import styles from './locationSelector.module.scss';

export interface LocationSelectorProps {
  currentLocation: LocationInfo | null;
  destination: string;
  onRefreshLocation: () => void;
  onDestinationChange: (dest: string) => void;
  /** 定位失败降级：手动输入所在城市（无坐标，仅城市匹配） */
  onManualCity: (city: string) => void;
}

export default function LocationSelector({
  currentLocation,
  destination,
  onRefreshLocation,
  onDestinationChange,
  onManualCity,
}: LocationSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [locFailed, setLocFailed] = useState(false);
  const [manualCity, setManualCity] = useState('');

  // 自动获取当前位置
  useEffect(() => {
    if (!currentLocation) {
      handleGetLocation();
    }
  }, []);

  // 获取当前位置（失败后降级为手动输入城市）
  const handleGetLocation = async () => {
    setIsLoading(true);
    setLocFailed(false);
    try {
      await Taro.getLocation({ type: 'gcj02' });
      onRefreshLocation();
    } catch (error) {
      console.error('获取位置失败', error);
      setLocFailed(true);
      Taro.showToast({
        title: '定位失败，可手动输入城市继续',
        icon: 'none',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 清除目的地
  const handleClearDestination = () => {
    onDestinationChange('');
  };

  return (
    <View className={styles.container}>
      {/* 当前位置 */}
      <View className={styles.locationItem}>
        <View className={styles.locationLabel}>
          <Text className={styles.labelIcon}>📍</Text>
          <Text className={styles.labelText}>当前位置</Text>
        </View>
        <View className={styles.locationValue} onClick={handleGetLocation}>
          <Text className={styles.valueText}>
            {isLoading
              ? '定位中...'
              : currentLocation?.name || (locFailed ? '定位失败' : '点击获取位置')}
          </Text>
          <Text className={styles.refreshIcon}>⟳</Text>
        </View>
        {/* 定位失败降级：手动输入城市 */}
        {locFailed && !currentLocation && (
          <View className={styles.manualCity}>
            <Input
              className={styles.manualInput}
              placeholder='手动输入城市，如：北京'
              placeholderClass={styles.placeholder}
              value={manualCity}
              onInput={(e) => {
                const v = e.detail.value;
                setManualCity(v);
                onManualCity(v.trim());
              }}
            />
          </View>
        )}
      </View>

      {/* 目的地 */}
      <View className={styles.locationItem}>
        <View className={styles.locationLabel}>
          <Text className={styles.labelIcon}>🎯</Text>
          <Text className={styles.labelText}>目的地</Text>
        </View>
        <View className={styles.destinationInput}>
          <Input
            className={styles.input}
            placeholder='想去哪里？'
            placeholderClass={styles.placeholder}
            value={destination}
            onInput={(e) => onDestinationChange(e.detail.value)}
          />
          {destination && (
            <View className={styles.clearBtn} onClick={handleClearDestination}>
              <Text className={styles.clearIcon}>×</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
