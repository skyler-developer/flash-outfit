import { useState } from 'react';
import Taro, { useLoad } from '@tarojs/taro';
import { ScrollView, Text, View, Image } from '@tarojs/components';
import PageLayout from '@/components/pageLayout';
import { BackButton } from '@/components/headerBar';
import { myApplications, MyApplicationItem } from '@/api/application';
import { ACTIVITY_TYPE_MAP } from '@/pages/publish/constants';
import styles from './myApplications.module.scss';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: '待审批', cls: 'statusPending' },
  approved: { label: '已通过', cls: 'statusApproved' },
  rejected: { label: '未通过', cls: 'statusRejected' },
};

export default function MyApplications() {
  const [list, setList] = useState<MyApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await myApplications(1, 50);
      setList(res.list);
    } catch (e) {
      const err = e as { message?: string };
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useLoad(() => {
    load();
  });

  const goToDetail = (requestId: number) => {
    Taro.navigateTo({ url: `/pages/detail/detail?id=${requestId}` });
  };

  return (
    <PageLayout>
      <View className={styles.page}>
        <View className={styles.header}>
          <BackButton onClick={() => Taro.navigateBack()} />
          <Text className={styles.headerTitle}>我的申请</Text>
        </View>

        <ScrollView scrollY className={styles.list}>
          {list.map((item) => {
            const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const req = item.request;
            const isApproved = item.status === 'approved';
            return (
              <View key={item.id} className={styles.card} onClick={() => req && goToDetail(req.id)}>
                {req ? (
                  req.coverImage ? (
                    <Image className={styles.cover} src={req.coverImage} mode='aspectFill' />
                  ) : (
                    <View className={`${styles.cover} ${styles.coverFallback}`}>
                      <Text className={`iconfont ${ACTIVITY_TYPE_MAP[req.type].iconClass} ${styles.coverIcon}`}>
                        {ACTIVITY_TYPE_MAP[req.type] && !ACTIVITY_TYPE_MAP[req.type].iconClass
                          ? ACTIVITY_TYPE_MAP[req.type].icon
                          : ''}
                      </Text>
                    </View>
                  )
                ) : (
                  <View className={`${styles.cover} ${styles.coverFallback}`}>
                    <Text className={styles.coverIcon}>已删除</Text>
                  </View>
                )}
                <View className={styles.info}>
                  <View className={styles.infoTop}>
                    <Text className={styles.dest}>{req ? req.destination : '请求已被发布者删除'}</Text>
                    <View className={`${styles.statusChip} ${styles[st.cls]}`}>
                      <Text className={styles.statusText}>{st.label}</Text>
                    </View>
                  </View>
                  {req && (
                    <Text className={styles.time}>
                      {req.activityTime.slice(0, 16).replace('T', ' ')} · {ACTIVITY_TYPE_MAP[req.type].label}
                      {req.expired ? ' · 已过期' : ''}
                    </Text>
                  )}
                  <Text className={styles.msg}>留言：{item.message}</Text>
                  {isApproved && item.publisherWechatId && (
                    <View className={styles.wechatRow}>
                      <Text className={styles.wechatLabel}>发起人微信</Text>
                      <Text
                        className={styles.wechatId}
                        onClick={(e) => {
                          e.stopPropagation();
                          Taro.setClipboardData({ data: item.publisherWechatId! });
                        }}
                      >
                        {item.publisherWechatId}（点击复制）
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          {!loading && list.length === 0 && (
            <View className={styles.empty}>
              <Text className={styles.emptyText}>还没有申请过，去首页看看吧</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </PageLayout>
  );
}
