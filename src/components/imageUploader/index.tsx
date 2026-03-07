import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { IMAGE_UPLOAD } from '@/pages/publish/constants';
import styles from './imageUploader.module.scss';

export interface ImageUploaderProps {
  images: string[];
  maxCount?: number;
  onAdd: (urls: string[]) => void;
  onRemove: (index: number) => void;
}

export default function ImageUploader({
  images,
  maxCount = IMAGE_UPLOAD.maxCount,
  onAdd,
  onRemove,
}: ImageUploaderProps) {
  // 选择图片
  const handleChooseImage = async () => {
    const remaining = maxCount - images.length;
    if (remaining <= 0) {
      Taro.showToast({
        title: `最多上传${maxCount}张图片`,
        icon: 'none',
      });
      return;
    }

    try {
      const res = await Taro.chooseMedia({
        mediaType: ['image'],
        count: remaining,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      });

      const tempFiles = res.tempFiles.map((file) => file.tempFilePath);
      // TODO: 上传图片到服务器
      // const uploadedUrls = await uploadImages(tempFiles);
      // onAdd(uploadedUrls);

      // 暂时直接使用临时路径
      onAdd(tempFiles);
    } catch (error) {
      console.error('选择图片失败', error);
    }
  };

  // 预览图片
  const handlePreview = (index: number) => {
    Taro.previewImage({
      current: images[index],
      urls: images,
    });
  };

  // 删除图片
  const handleRemove = (index: number, e) => {
    e.stopPropagation();
    Taro.showModal({
      title: '提示',
      content: '确定删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          onRemove(index);
        }
      },
    });
  };

  return (
    <View className={styles.container}>
      <View className={styles.tip}>
        <Text className={styles.tipText}>展示你的精彩生活，最多上传{maxCount}张</Text>
        <Text className={styles.count}>{images.length}/{maxCount}</Text>
      </View>

      <View className={styles.imageGrid}>
        {/* 已上传的图片 */}
        {images.map((src, index) => (
          <View
            key={src}
            className={styles.imageItem}
            onClick={() => handlePreview(index)}
          >
            <Image className={styles.image} src={src} mode="aspectFill" />
            <View
              className={styles.deleteBtn}
              onClick={(e) => handleRemove(index, e)}
            >
              <Text className={styles.deleteIcon}>×</Text>
            </View>
          </View>
        ))}

        {/* 上传按钮 */}
        {images.length < maxCount && (
          <View className={styles.uploadBtn} onClick={handleChooseImage}>
            <Text className={styles.uploadIcon}>+</Text>
          </View>
        )}
      </View>
    </View>
  );
}
