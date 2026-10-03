import { useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { ScrollView, Text, View } from '@tarojs/components';
import SmartImage from '@/components/smartImage';
import PageLayout from '@/components/pageLayout';
import { BackButton } from '@/components/headerBar';
import { myPublishedRequests, MyPublishedItem } from '@/api/requestApi';
import { ACTIVITY_TYPE_MAP } from '@/pages/publish/constants';
import styles from './myRequests.module.scss';

const STATUS_LABEL: Record<string, string> = {
  recruiting: '招募中',
  grouped: '已成组',
  finished: '已结束',
  cancelled: '已取消',
};

// 内容安全审核状态标记（先审后展）：未通过红色、审核中橙色、通过后绿色，随 item.reviewStatus 渲染

export default function MyRequests() {
  const [list, setList] = useState<MyPublishedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await myPublishedRequests(1, 50);
      setList(res.list);
    } catch (e) {
      const err = e as { message?: string };
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  // 用 useDidShow：从管理/编辑页返回时刷新审核状态（回调是异步落库的）
  useDidShow(() => {
    load();
  });

  const goToManage = (id: number) => {
    Taro.navigateTo({ url: `/pages/manageRequest/manageRequest?id=${id}` });
  };

  return (
    <PageLayout>
      <View className={styles.page}>
        <View className={styles.header}>
          <BackButton onClick={() => Taro.navigateBack()} />
          <Text className={styles.headerTitle}>我发布的请求</Text>
        </View>

        <ScrollView scrollY className={styles.list}>
          {list.map((item) => (
            <View key={item.id} className={styles.item} onClick={() => goToManage(item.id)}>
              {item.coverImage ? (
                <SmartImage className={styles.cover} src={item.coverImage} mode='aspectFill' />
              ) : (
                <View className={`${styles.cover} ${styles.coverFallback}`}>
                  <Text className={`iconfont ${ACTIVITY_TYPE_MAP[item.type].iconClass} ${styles.coverIcon}`}>
                    {ACTIVITY_TYPE_MAP[item.type] && !ACTIVITY_TYPE_MAP[item.type].iconClass
                      ? ACTIVITY_TYPE_MAP[item.type].icon
                      : ''}
                  </Text>
                </View>
              )}
              <View className={styles.info}>
                <Text className={styles.dest}>{item.destination}</Text>
                <Text className={styles.time}>{item.activityTime.slice(0, 16).replace('T', ' ')}</Text>
                <View className={styles.tags}>
                  {item.reviewStatus === 'rejected' ? (
                    <View className={styles.tagReviewRejected}>
                      <Text className={styles.tagReviewRejectedText}>审核未通过</Text>
                    </View>
                  ) : item.reviewStatus === 'checking' ? (
                    <View className={styles.tagReviewChecking}>
                      <Text className={styles.tagReviewCheckingText}>审核中</Text>
                    </View>
                  ) : (
                    <View className={styles.tagReviewPass}>
                      <Text className={styles.tagReviewPassText}>审核通过</Text>
                    </View>
                  )}
                  <View className={styles.tag}>
                    <Text className={styles.tagText}>
                      {item.expired ? '已过期' : STATUS_LABEL[item.status] || item.status}
                    </Text>
                  </View>
                  <View className={styles.tag}>
                    <Text className={styles.tagText}>
                      {item.approvedCount}/{item.maxMembers}人
                    </Text>
                  </View>
                  {item.pendingCount > 0 && (
                    <View className={styles.tagPending}>
                      <Text className={styles.tagPendingText}>{item.pendingCount} 待审批</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text className={styles.arrow}>›</Text>
            </View>
          ))}
          {!loading && list.length === 0 && (
            <View className={styles.empty}>
              <Text className={styles.emptyText}>还没有发布过请求，去发布一个吧</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </PageLayout>
  );
}
