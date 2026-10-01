import { View, Text, Image } from '@tarojs/components';
import type { RequestListItem } from '@/api/requestApi';
import { ACTIVITY_TYPE_MAP } from '@/pages/publish/constants';
import styles from './requestCard.module.scss';

const GENDER_LABEL: Record<string, string> = { all: '不限', female: '仅女生', male: '仅男生' };

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${sameYear ? '' : d.getFullYear() + '年'}${md} ${hh}:${mm}`;
}

export interface RequestCardProps {
  item: RequestListItem;
  onClick?: (id: number) => void;
}

export default function RequestCard({ item, onClick }: RequestCardProps) {
  const typeInfo = ACTIVITY_TYPE_MAP[item.type];

  return (
    <View
      className={`${styles.card} ${item.expired ? styles.expired : ''}`}
      onClick={() => onClick?.(item.id)}
    >
      <View className={styles.coverWrap}>
        {item.coverImage ? (
          <Image className={styles.cover} src={item.coverImage} mode='aspectFill' lazyLoad />
        ) : (
          <View className={`${styles.cover} ${styles.coverFallback}`}>
            <Text className={`iconfont ${typeInfo?.iconClass || ''} ${styles.coverIcon}`} />
          </View>
        )}
        <View className={`${styles.typeTag} ${styles[`tag_${item.type}`] || ''}`}>
          <Text className={styles.typeTagText}>{typeInfo?.label || item.type}</Text>
        </View>
        {item.expired && (
          <View className={styles.expiredMask}>
            <Text className={styles.expiredText}>已过期</Text>
          </View>
        )}
      </View>

      <View className={styles.body}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{item.destination}</Text>
          {item.myApplicationStatus && (
            <View className={`${styles.applyBadge} ${styles[`apply_${item.myApplicationStatus}`] || ''}`}>
              <Text className={styles.applyBadgeText}>
                {item.myApplicationStatus === 'pending'
                  ? '待审批'
                  : item.myApplicationStatus === 'approved'
                    ? '已加入'
                    : '未通过'}
              </Text>
            </View>
          )}
        </View>

        <Text className={styles.summary}>{item.descriptionSummary}</Text>

        <View className={styles.metaRow}>
          <View className={styles.metaItem}>
            <Text className={`iconfont icon-flash-outfitcalendar ${styles.metaIcon}`} />
            <Text className={styles.metaText}>{formatDate(item.activityTime)}</Text>
          </View>
          {item.distanceKm != null && (
            <View className={styles.metaItem}>
              <Text className={`iconfont icon-flash-outfitPositionIcon ${styles.metaIcon}`} />
              <Text className={styles.metaText}>
                {item.distanceKm < 1 ? '<1km' : `${item.distanceKm}km`}
              </Text>
            </View>
          )}
        </View>

        <View className={styles.footer}>
          <View className={styles.publisher}>
            {item.publisher?.avatar ? (
              <Image className={styles.avatar} src={item.publisher.avatar} mode='aspectFill' />
            ) : (
              <View className={`${styles.avatar} ${styles.avatarFallback}`} />
            )}
            <Text className={styles.nickname}>{item.publisher?.nickname || '闪搭用户'}</Text>
          </View>
          <View className={styles.prefs}>
            <Text className={styles.prefText}>
              {GENDER_LABEL[item.genderPreference] || '不限'} · {item.ageRange[0]}-{item.ageRange[1]}岁
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
