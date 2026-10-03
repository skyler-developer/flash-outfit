import { useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import type { ImageProps } from '@tarojs/components';
import styles from './index.module.scss';

export interface SmartImageProps extends ImageProps {
  /** 追加到占位层的自定义样式类（默认浅灰底） */
  placeholderClassName?: string;
}

/**
 * 带加载占位的图片组件：
 * - 加载中：灰色底 + 居中旋转 icon（iconfont「图片」图标）
 * - 加载完成：正常展示，占位层隐藏
 * - 加载失败：保留占位（图片不渲染，避免破图）
 * 宽高由外层容器或 className 控制，用法与原生 Image 一致。
 */
export default function SmartImage({
  className,
  placeholderClassName = '',
  onLoad,
  onError,
  ...rest
}: SmartImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <View className={`${styles.wrapper} ${className || ''}`}>
      <Image
        {...rest}
        className={`${styles.image} ${status === 'loaded' ? styles.visible : styles.hidden}`}
        onLoad={(e) => {
          setStatus('loaded');
          onLoad?.(e);
        }}
        onError={(e) => {
          setStatus('error');
          onError?.(e);
        }}
      />
      {status !== 'loaded' && (
        <View className={`${styles.placeholder} ${placeholderClassName}`}>
          <Text className={`iconfont icon-flash-outfitpicture ${styles.loadingIcon}`} />
        </View>
      )}
    </View>
  );
}
