import { View, Text, Picker } from '@tarojs/components';
import { useEffect, useState } from 'react';
import type { LocationInfo } from '@/stores/publishStore/usePublishStore';
import styles from './locationSelector.module.scss';

type Region = [string, string, string];

export interface LocationSelectorProps {
  currentLocation: LocationInfo | null;
  destinationRegion: Region | null;
  destination?: string;
  onRefreshLocation: () => Promise<void>;
  onCurrentRegionChange: (region: Region) => void;
  onDestinationRegionChange: (region: Region) => void;
}

export default function LocationSelector({
  currentLocation,
  destinationRegion,
  destination,
  onRefreshLocation,
  onCurrentRegionChange,
  onDestinationRegionChange,
}: LocationSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetLocation = async () => {
    setIsLoading(true);
    try {
      await onRefreshLocation();
    } finally {
      setIsLoading(false);
    }
  };

  // 首次打开发布页尝试定位；失败时仍可手动选择地区。
  useEffect(() => {
    if (!currentLocation) {
      handleGetLocation();
    }
  }, []);

  const handleRegionChange = (
    e: { detail: { value: string[] } },
    onChange: (region: Region) => void,
  ) => {
    const region = e.detail.value;
    if (region.length === 3 && region.every(Boolean)) {
      onChange([region[0], region[1], region[2]]);
    }
  };

  return (
    <View>
      <View className={styles.locationItem}>
        <View className={styles.locationLabel}>
          <Text className={styles.labelIcon}>📍</Text>
          <Text className={styles.labelText}>当前位置</Text>
        </View>
        <View className={styles.locationControls}>
          <Picker
            className={styles.regionPicker}
            mode='region'
            value={currentLocation?.region || []}
            onChange={(e) => handleRegionChange(e, onCurrentRegionChange)}
          >
            <View className={styles.regionValue}>
              <Text className={currentLocation?.name ? styles.valueText : styles.placeholder}>
                {currentLocation?.name || '选择省 / 市 / 区'}
              </Text>
              <Text className={styles.arrow}>›</Text>
            </View>
          </Picker>
          <View className={styles.locateButton} onClick={handleGetLocation}>
            <Text className={styles.locateText}>{isLoading ? '定位中' : '定位'}</Text>
          </View>
        </View>
      </View>

      <View className={styles.locationItem}>
        <View className={styles.locationLabel}>
          <Text className={styles.labelIcon}>🎯</Text>
          <Text className={styles.labelText}>目的地</Text>
        </View>
        <Picker
          className={styles.regionPicker}
          mode='region'
          value={destinationRegion || []}
          onChange={(e) => handleRegionChange(e, onDestinationRegionChange)}
        >
          <View className={styles.regionValue}>
              <Text className={destination ? styles.valueText : styles.placeholder}>
                {destinationRegion?.join('') || destination || '选择省 / 市 / 区'}
            </Text>
            <Text className={styles.arrow}>›</Text>
          </View>
        </Picker>
      </View>
    </View>
  );
}
