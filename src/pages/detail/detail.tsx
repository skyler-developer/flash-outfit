import { useState } from 'react';
import Taro, { useLoad, useRouter } from '@tarojs/taro';
import { ScrollView, Swiper, SwiperItem, Text, Textarea, View, Image, Button } from '@tarojs/components';
import PageLayout from '@/components/pageLayout';
import { BackButton } from '@/components/headerBar';
import { getRequest, RequestDetail } from '@/api/requestApi';
import { applyRequest } from '@/api/application';
import { useUserStore } from '@/stores/userStore/useUserStore';
import { useUnreadStore } from '@/stores/unreadStore/useUnreadStore';
import { ACTIVITY_TYPE_MAP } from '@/pages/publish/constants';
import styles from './detail.module.scss';

const GENDER_LABEL: Record<string, string> = { all: '不限', female: '仅女生', male: '仅男生' };

function formatFull(iso: string): string {
  const d = new Date(iso);
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（周${week}） ${String(
    d.getHours(),
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Detail() {
  const router = useRouter();
  const id = Number(router.params.id);

  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const user = useUserStore((s) => s.user);
  const ensureLogin = useUserStore((s) => s.ensureLogin);
  const refreshUnread = useUnreadStore((s) => s.refreshUnread);

  const load = async () => {
    try {
      await ensureLogin();
      const d = await getRequest(id);
      setDetail(d);
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

  const handleApplyClick = async () => {
    if (!user?.profileCompleted) {
      Taro.showModal({
        title: '完善资料',
        content: '申请前需完善基本资料（性别、出生年份）',
        confirmText: '去完善',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: `/pages/profileEdit/profileEdit?from=apply&requestId=${id}` });
          }
        },
      });
      return;
    }
    setShowApply(true);
  };

  const handleSubmitApply = async () => {
    const msg = message.trim();
    if (!msg) {
      Taro.showToast({ title: '写一句话介绍自己吧', icon: 'none' });
      return;
    }
    if (msg.length > 100) {
      Taro.showToast({ title: '留言不能超过100字', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      await applyRequest(id, msg);
      setShowApply(false);
      setMessage('');
      Taro.showToast({ title: '已提交申请', icon: 'success' });
      await load();
      refreshUnread();
    } catch (e) {
      const err = e as { message?: string };
      Taro.showToast({ title: err.message || '提交失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const goToManage = () => {
    Taro.navigateTo({ url: `/pages/manageRequest/manageRequest?id=${id}` });
  };

  if (loading) {
    return (
      <PageLayout>
        <View className={styles.loadingPage}>
          <Text className={styles.loadingText}>加载中…</Text>
        </View>
      </PageLayout>
    );
  }

  if (!detail) {
    return (
      <PageLayout>
        <View className={styles.loadingPage}>
          <Text className={styles.loadingText}>请求不存在或已被删除</Text>
        </View>
      </PageLayout>
    );
  }

  const typeInfo = ACTIVITY_TYPE_MAP[detail.type];
  const canShowApply =
    !detail.isPublisher &&
    detail.status === 'recruiting' &&
    !detail.expired &&
    detail.myApplicationStatus !== 'approved';

  const applyDisabled = !detail.applicable;

  return (
    <PageLayout>
      <ScrollView scrollY className={styles.page}>
        {/* 照片轮播 */}
        <View className={styles.gallery}>
          {detail.photos.length > 0 ? (
            <Swiper className={styles.swiper} circular indicatorDots={detail.photos.length > 1}>
              {detail.photos.map((p, i) => (
                <SwiperItem key={`${p}-${i}`}>
                  <Image
                    className={styles.photo}
                    src={p}
                    mode='aspectFill'
                    onClick={() => Taro.previewImage({ urls: detail.photos, current: p })}
                  />
                </SwiperItem>
              ))}
            </Swiper>
          ) : (
            <View className={`${styles.photo} ${styles.photoFallback}`}>
              <Text className={`iconfont ${typeInfo.iconClass} ${styles.photoFallbackIcon}`}>
                {typeInfo && !typeInfo.iconClass ? typeInfo.icon : ''}
              </Text>
            </View>
          )}
          <BackButton className={styles.backBtn} onClick={() => Taro.navigateBack()} />
        </View>

        {/* 主体 */}
        <View className={styles.body}>
          {/* 标题行 */}
          <View className={styles.titleRow}>
            <View className={`${styles.typeTag} ${styles[`tag_${detail.type}`] || ''}`}>
              <Text className={styles.typeTagText}>{typeInfo.label}</Text>
            </View>
            <Text className={styles.title}>{detail.destination}</Text>
          </View>
          {detail.expired && <View className={styles.expiredTag}><Text className={styles.expiredTagText}>已过期</Text></View>}

          {/* 元信息 */}
          <View className={styles.metaCard}>
            <View className={styles.metaItem}>
              <Text className={`iconfont icon-flash-outfitcalendar ${styles.metaIcon}`} />
              <View className={styles.metaContent}>
                <Text className={styles.metaLabel}>活动时间</Text>
                <Text className={styles.metaValue}>{formatFull(detail.activityTime)}</Text>
              </View>
            </View>
            <View className={styles.metaItem}>
              <Text className={`iconfont icon-flash-outfitPositionIcon ${styles.metaIcon}`} />
              <View className={styles.metaContent}>
                <Text className={styles.metaLabel}>活动地点</Text>
                <Text className={styles.metaValue}>
                  {detail.destination} · {detail.location.city}
                </Text>
              </View>
            </View>
            <View className={styles.metaItem}>
              <Text className={`iconfont icon-flash-outfitPartnerPreference ${styles.metaIcon}`} />
              <View className={styles.metaContent}>
                <Text className={styles.metaLabel}>伙伴偏好</Text>
                <Text className={styles.metaValue}>
                  {GENDER_LABEL[detail.genderPreference]} · {detail.ageRange[0]}-{detail.ageRange[1]}岁 ·
                  招 {detail.maxMembers} 人
                  {detail.approvedCount > 0 && `（已加入 ${detail.approvedCount}）`}
                </Text>
              </View>
            </View>
          </View>

          {/* 描述 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>活动描述</Text>
            <Text className={styles.description}>{detail.description}</Text>
          </View>

          {/* 发起人 */}
          {detail.publisher && (
            <View className={styles.section}>
              <Text className={styles.sectionTitle}>发起人</Text>
              <View className={styles.publisherCard}>
                {detail.publisher.avatar ? (
                  <Image className={styles.publisherAvatar} src={detail.publisher.avatar} mode='aspectFill' />
                ) : (
                  <View className={`${styles.publisherAvatar} ${styles.avatarFallback}`} />
                )}
                <View className={styles.publisherInfo}>
                  <Text className={styles.publisherName}>{detail.publisher.nickname}</Text>
                  <Text className={styles.publisherMeta}>
                    {detail.publisher.gender === 'female' ? '♀' : '♂'} {detail.publisher.age}岁 ·{' '}
                    {detail.publisher.interests
                      .map((i) => ACTIVITY_TYPE_MAP[i as keyof typeof ACTIVITY_TYPE_MAP]?.label || i)
                      .join('/')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View className={styles.bottomSpace} />
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className={styles.actionBar}>
        {detail.isPublisher ? (
          <Button className={styles.primaryBtn} onClick={goToManage}>
            <Text className={styles.primaryBtnText}>管理我的请求</Text>
          </Button>
        ) : canShowApply ? (
          <Button
            className={`${styles.primaryBtn} ${applyDisabled ? styles.btnDisabled : ''}`}
            disabled={applyDisabled}
            onClick={handleApplyClick}
          >
            <Text className={styles.primaryBtnText}>
              {applyDisabled ? detail.applicableReason || '暂不可申请' : detail.myApplicationStatus === 'pending' ? '等待发布者审批' : '申请加入'}
            </Text>
          </Button>
        ) : detail.myApplicationStatus === 'approved' ? (
          <View className={styles.approvedBar}>
            <Text className={styles.approvedText}>已成功加入，可前往「我的-我的申请」查看发布者微信号</Text>
          </View>
        ) : (
          <View className={styles.approvedBar}>
            <Text className={styles.approvedText}>
              {detail.status !== 'recruiting' ? '该请求已结束' : '已过期，不可申请'}
            </Text>
          </View>
        )}
      </View>

      {/* 申请弹窗 */}
      {showApply && (
        <View className={styles.modalMask} onClick={() => !submitting && setShowApply(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>申请加入「{detail.destination}」</Text>
            <Text className={styles.modalDesc}>写一句话让发布者更快了解你（必填，100字内）</Text>
            <Textarea
              className={styles.modalTextarea}
              value={message}
              onInput={(e) => setMessage(e.detail.value)}
              maxlength={100}
              placeholder='例：我也一直想去这里，带了相机，可以互相拍～'
              placeholderClass={styles.placeholder}
              autoFocus
            />
            <View className={styles.modalActions}>
              <Button
                className={styles.cancelBtn}
                disabled={submitting}
                onClick={() => setShowApply(false)}
              >
                <Text className={styles.cancelText}>取消</Text>
              </Button>
              <Button
                className={styles.confirmBtn}
                loading={submitting}
                disabled={submitting}
                onClick={handleSubmitApply}
              >
                <Text className={styles.confirmText}>提交申请</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </PageLayout>
  );
}
