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
}

export default function LocationSelector({
  currentLocation,
  destination,
  onRefreshLocation,
  onDestinationChange,
}: LocationSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  // 自动获取当前位置
  useEffect(() => {
    if (!currentLocation) {
      handleGetLocation();
    }
  }, []);

  // 获取当前位置
  const handleGetLocation = async () => {
    setIsLoading(true);
    try {
      const res = await Taro.getLocation({ type: 'gcj02' });
      // 使用逆地理编码获取城市名（这里简化处理，实际需要调用地图API）
      // TODO: 调用地图API获取具体地址名称
      const locationInfo: LocationInfo = {
        name: '上海', // 占位，实际应从地图API获取
        latitude: res.latitude,
        longitude: res.longitude,
      };
      onRefreshLocation();
      // 这里通过回调更新状态
    } catch (error) {
      console.error('获取位置失败', error);
      Taro.showToast({
        title: '获取位置失败，请手动输入',
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
            {isLoading ? '定位中...' : currentLocation?.name || '点击获取位置'}
          </Text>
          <Text className={styles.refreshIcon}>⟳</Text>
        </View>
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
            placeholder="想去哪里？"
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
