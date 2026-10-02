import { useCallback, useState } from 'react';
import Taro, { useLoad, useRouter } from '@tarojs/taro';
import { ScrollView, Text, View, Image, Button, Switch, Textarea } from '@tarojs/components';
import PageLayout from '@/components/pageLayout';
import { BackButton } from '@/components/headerBar';
import { getRequest, updateRequest, deleteRequest, RequestDetail } from '@/api/requestApi';
import { listApplicationsByRequest, reviewApplication, ApplicationItem } from '@/api/application';
import { useUnreadStore } from '@/stores/unreadStore/useUnreadStore';
import styles from './manageRequest.module.scss';

type TabKey = 'pending' | 'approved' | 'rejected';

export default function ManageRequest() {
  const router = useRouter();
  const id = Number(router.params.id);

  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [tab, setTab] = useState<TabKey>('pending');
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  // 编辑表单
  const [editDesc, setEditDesc] = useState('');
  const [editMax, setEditMax] = useState(1);
  const [editAutoClose, setEditAutoClose] = useState(false);

  const refreshUnread = useUnreadStore((s) => s.refreshUnread);

  const loadApps = useCallback(
    async (status: TabKey) => {
      try {
        const res = await listApplicationsByRequest(id, status);
        setApps(res.list);
      } catch (e) {
        const err = e as { message?: string };
        Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
      }
    },
    [id],
  );

  const loadDetail = useCallback(async () => {
    try {
      const d = await getRequest(id);
      setDetail(d);
      return d;
    } catch (e) {
      const err = e as { message?: string };
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
      return null;
    }
  }, [id]);

  useLoad(async () => {
    const d = await loadDetail();
    if (d) {
      setEditDesc(d.description);
      setEditMax(d.maxMembers);
      setEditAutoClose(d.autoCloseOnGrouped);
      await loadApps('pending');
    }
    setLoading(false);
  });

  const switchTab = async (k: TabKey) => {
    setTab(k);
    setApps([]);
    await loadApps(k);
  };

  const handleReview = async (appId: number, action: 'approve' | 'reject') => {
    setReviewing(appId);
    try {
      await reviewApplication(appId, action);
      Taro.showToast({
        title: action === 'approve' ? '已同意' : '已拒绝',
        icon: 'success',
      });
      await Promise.all([loadDetail(), loadApps(tab)]);
      refreshUnread();
    } catch (e) {
      const err = e as { message?: string };
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
    } finally {
      setReviewing(null);
    }
  };

  const handleSaveEdit = async () => {
    if (editDesc.trim().length < 10) {
      Taro.showToast({ title: '描述至少10个字', icon: 'none' });
      return;
    }
    try {
      await updateRequest(id, {
        description: editDesc.trim(),
        maxMembers: editMax,
        autoCloseOnGrouped: editAutoClose,
      });
      setShowEdit(false);
      await loadDetail();
      Taro.showToast({ title: '已保存', icon: 'success' });
    } catch (e) {
      const err = e as { message?: string };
      Taro.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
  };

  const handleFinish = () => {
    Taro.showModal({
      title: '结束招募',
      content: '结束后该请求将不再展示，确定结束吗？',
      success: async (res) => {
        if (res.confirm && detail?.status === 'recruiting') {
          try {
            await updateRequest(id, { status: 'finished' });
            await loadDetail();
            Taro.showToast({ title: '已结束招募', icon: 'success' });
          } catch (e) {
            const err = e as { message?: string };
            Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleDelete = () => {
    Taro.showModal({
      title: '删除请求',
      content: '删除后将通知所有申请人，且无法恢复，确定删除吗？',
      confirmColor: '#dc2626',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteRequest(id);
            Taro.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 800);
          } catch (e) {
            const err = e as { message?: string };
            Taro.showToast({ title: err.message || '删除失败', icon: 'none' });
          }
        }
      },
    });
  };

  if (loading) {
    return (
      <PageLayout>
        <View className={styles.loadingPage}>
          <Text className={styles.muted}>加载中…</Text>
        </View>
      </PageLayout>
    );
  }

  if (!detail) {
    return (
      <PageLayout>
        <View className={styles.loadingPage}>
          <Text className={styles.muted}>请求不存在或已被删除</Text>
        </View>
      </PageLayout>
    );
  }

  const isFull = detail.approvedCount >= detail.maxMembers;

  return (
    <PageLayout>
      <View className={styles.page}>
        <View className={styles.header}>
          <BackButton onClick={() => Taro.navigateBack()} />
          <Text className={styles.headerTitle}>请求管理</Text>
        </View>

        <ScrollView scrollY className={styles.body}>
          {/* 请求概要 */}
          <View className={styles.summaryCard}>
            <Text className={styles.dest}>{detail.destination}</Text>
            <View className={styles.summaryMeta}>
              <Text className={styles.summaryText}>
                {detail.approvedCount}/{detail.maxMembers} 人已加入 · 待审批 {detail.pendingCount}
              </Text>
              <Text className={styles.summaryText}>{detail.activityTime.slice(0, 16).replace('T', ' ')}</Text>
            </View>

            <View className={styles.actionsRow}>
              <View className={styles.miniBtn} onClick={() => setShowEdit(true)}>
                <Text className={styles.miniBtnText}>修改</Text>
              </View>
              {detail.status === 'recruiting' && (
                <View className={styles.miniBtn} onClick={handleFinish}>
                  <Text className={styles.miniBtnText}>结束招募</Text>
                </View>
              )}
              <View className={styles.miniBtnDanger} onClick={handleDelete}>
                <Text className={styles.miniBtnDangerText}>删除</Text>
              </View>
            </View>
          </View>

          {/* 申请列表 */}
          <View className={styles.tabs}>
            {(
              [
                ['pending', '待审批'],
                ['approved', '已同意'],
                ['rejected', '已拒绝'],
              ] as [TabKey, string][]
            ).map(([k, label]) => (
              <View
                key={k}
                className={`${styles.tab} ${tab === k ? styles.tabActive : ''}`}
                onClick={() => switchTab(k)}
              >
                <Text className={styles.tabText}>{label}</Text>
              </View>
            ))}
          </View>

          {apps.map((app) => (
            <View key={app.id} className={styles.appCard}>
              <View className={styles.appHead}>
                {app.applicant.avatar ? (
                  <Image className={styles.appAvatar} src={app.applicant.avatar} mode='aspectFill' />
                ) : (
                  <View className={`${styles.appAvatar} ${styles.avatarFallback}`} />
                )}
                <View className={styles.appHeadInfo}>
                  <Text className={styles.appName}>{app.applicant.nickname}</Text>
                  <Text className={styles.appMeta}>
                    {app.applicant.gender === 'female' ? '♀' : '♂'} {app.applicant.age}岁
                  </Text>
                </View>
                {app.applicant.wechatId && (
                  <View className={styles.wechatChip}>
                    <Text className={styles.wechatChipText}>微信: {app.applicant.wechatId}</Text>
                  </View>
                )}
              </View>
              <View className={styles.messageBox}>
                <Text className={styles.messageText}>{app.message}</Text>
              </View>
              {tab === 'pending' && (
                <View className={styles.reviewRow}>
                  <Button
                    className={styles.rejectBtn}
                    loading={reviewing === app.id}
                    disabled={reviewing === app.id}
                    onClick={() => handleReview(app.id, 'reject')}
                  >
                    <Text className={styles.rejectText}>拒绝</Text>
                  </Button>
                  <Button
                    className={`${styles.approveBtn} ${isFull ? styles.btnDisabled : ''}`}
                    loading={reviewing === app.id}
                    disabled={reviewing === app.id || isFull}
                    onClick={() => handleReview(app.id, 'approve')}
                  >
                    <Text className={styles.approveText}>{isFull ? '已满员' : '同意'}</Text>
                  </Button>
                </View>
              )}
            </View>
          ))}
          {apps.length === 0 && (
            <View className={styles.emptyApps}>
              <Text className={styles.muted}>
                {tab === 'pending' ? '暂无待审批申请' : tab === 'approved' ? '还没有通过的申请' : '没有已拒绝的申请'}
              </Text>
            </View>
          )}
          <View className={styles.bottomSpace} />
        </ScrollView>
      </View>

      {/* 编辑弹窗 */}
      {showEdit && (
        <View className={styles.modalMask} onClick={() => setShowEdit(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>修改请求</Text>
            <Text className={styles.fieldLabel}>活动描述</Text>
            <Textarea
              className={styles.modalTextarea}
              value={editDesc}
              onInput={(e) => setEditDesc(e.detail.value)}
              maxlength={500}
              autoHeight
            />
            <Text className={styles.fieldLabel}>搭子人数上限</Text>
            <View className={styles.stepperRow}>
              <View
                className={`${styles.stepBtn} ${editMax <= 1 ? styles.stepDisabled : ''}`}
                onClick={() => editMax > 1 && setEditMax(editMax - 1)}
              >
                <Text className={styles.stepIcon}>−</Text>
              </View>
              <Text className={styles.memberValue}>{editMax}</Text>
              <View
                className={`${styles.stepBtn} ${editMax >= 9 ? styles.stepDisabled : ''}`}
                onClick={() => editMax < 9 && setEditMax(editMax + 1)}
              >
                <Text className={styles.stepIcon}>+</Text>
              </View>
            </View>
            <View className={styles.switchRow}>
              <Text className={styles.fieldLabelInline}>成组后自动结束招募</Text>
              <Switch checked={editAutoClose} color='#F49D25' onChange={(e) => setEditAutoClose(e.detail.value)} />
            </View>
            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={() => setShowEdit(false)}>
                <Text className={styles.cancelText}>取消</Text>
              </Button>
              <Button className={styles.confirmBtn} onClick={handleSaveEdit}>
                <Text className={styles.confirmText}>保存</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </PageLayout>
  );
}
