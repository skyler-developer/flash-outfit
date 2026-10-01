import { useCallback, useEffect, useState } from 'react';
import Taro, { useLoad, usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { ScrollView, Text, View, Picker } from '@tarojs/components';
import PageLayout from '@/components/pageLayout';
import CustomTabBar from '@/customTabBar';
import RequestCard from '@/components/requestCard';
import { listRequests, RequestListItem } from '@/api/requestApi';
import { useTabsStore } from '@/stores/tabsStore/useTabsStore';
import { useUserStore } from '@/stores/userStore/useUserStore';
import styles from './home.module.scss';

/** 筛选维度（对齐需求 §4.2） */
const TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'travel', label: '旅行' },
  { value: 'photography', label: '摄影' },
  { value: 'sports', label: '运动' },
];

const TIME_OPTIONS = [
  { value: 'all', label: '不限' },
  { value: 'weekend', label: '本周末' },
  { value: 'd7', label: '近7天' },
  { value: 'd30', label: '近30天' },
];

const DISTANCE_OPTIONS = [
  { value: 0, label: '距离不限' },
  { value: 5, label: '5km' },
  { value: 10, label: '10km' },
  { value: 50, label: '50km' },
];

const PAGE_SIZE = 10;

/** 城市降级模式的可选城市（拒绝定位后手动选择） */
const CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安',
  '南京', '重庆', '长沙', '厦门', '青岛', '昆明', '天津', '苏州',
];

export default function Home() {
  const { setSelectedTab } = useTabsStore();
  useLoad(() => setSelectedTab(0));

  const [type, setType] = useState('');
  const [timeRange, setTimeRange] = useState<'all' | 'weekend' | 'd7' | 'd30'>('all');
  const [distance, setDistance] = useState(0);
  const [onlyApplicable, setOnlyApplicable] = useState(false);

  const [list, setList] = useState<RequestListItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [locMode, setLocMode] = useState<'coords' | 'city' | 'none'>('coords');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState('');

  // 定位：进入时一次性授权；拒绝则降级为「选择城市」模式（用户手动选城市）
  useEffect(() => {
    Taro.getLocation({ type: 'gcj02' })
      .then((res) => {
        setCoords({ lat: res.latitude, lng: res.longitude });
        setLocMode('coords');
      })
      .catch(() => {
        setLocMode('city');
      });
  }, []);

  const fetchList = useCallback(
    async (pageNo: number, replace: boolean) => {
      if (loading) return;
      setLoading(true);
      try {
        const res = await listRequests({
          page: pageNo,
          pageSize: PAGE_SIZE,
          type: type || undefined,
          timeRange: timeRange === 'all' ? undefined : timeRange,
          distance: distance || undefined,
          onlyApplicable: onlyApplicable || undefined,
          ...(locMode === 'coords' && coords
            ? { lat: coords.lat, lng: coords.lng, sortBy: 'distance' as const }
            : { city: city || '北京', sortBy: 'time' as const }),
        });
        setList((prev) => (replace ? res.list : [...prev, ...res.list]));
        setFinished(replace ? res.list.length < PAGE_SIZE : list.length + res.list.length >= res.total);
        setPage(pageNo);
      } catch (e) {
        const err = e as { message?: string };
        Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, timeRange, distance, onlyApplicable, locMode, coords, city],
  );

  // 筛选条件或定位模式变化 → 重置第一页
  useEffect(() => {
    if (locMode === 'none') return;
    setFinished(false);
    setList([]);
    fetchList(1, true);
  }, [fetchList, locMode]);

  usePullDownRefresh(() => {
    if (locMode === 'none') {
      Taro.stopPullDownRefresh();
      return;
    }
    fetchList(1, true).finally(() => Taro.stopPullDownRefresh());
  });

  useReachBottom(() => {
    if (loading || finished || locMode === 'none') return;
    fetchList(page + 1, false);
  });

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  };

  const user = useUserStore((s) => s.user);
  const showProfileGuide = user && !user.profileCompleted;

  return (
    <PageLayout>
      <View className={styles.page}>
        {/* 顶部标题 */}
        <View className={styles.header}>
          <Text className={styles.logo}>闪搭</Text>
          <Text className={styles.slogan}>
            {locMode === 'coords'
              ? '为你找到身边的搭子'
              : locMode === 'city'
                ? city
                  ? `${city} · 按时间推荐`
                  : '选择城市开始浏览'
                : '加载中…'}
          </Text>
          {locMode === 'city' && city && (
            <View
              className={styles.citySwitch}
              onClick={() => {
                setCity('');
                setList([]);
                setFinished(false);
              }}
            >
              <Text className={styles.citySwitchText}>切换城市</Text>
            </View>
          )}
        </View>

        {/* 筛选区 */}
        <View className={styles.filterBar}>
          <ScrollView scrollX className={styles.filterScroll} enableFlex>
            {TYPE_OPTIONS.map((opt) => (
              <View
                key={opt.value}
                className={`${styles.chip} ${type === opt.value ? styles.chipActive : ''}`}
                onClick={() => setType(opt.value)}
              >
                <Text className={styles.chipText}>{opt.label}</Text>
              </View>
            ))}
          </ScrollView>
          <View className={styles.filterRow}>
            {TIME_OPTIONS.map((opt) => (
              <View
                key={opt.value}
                className={`${styles.chip} ${styles.chipSm} ${timeRange === opt.value ? styles.chipActive : ''}`}
                onClick={() => setTimeRange(opt.value as typeof timeRange)}
              >
                <Text className={styles.chipText}>{opt.label}</Text>
              </View>
            ))}
          </View>
          <View className={styles.filterRow}>
            {DISTANCE_OPTIONS.map((opt) => (
              <View
                key={opt.value}
                className={`${styles.chip} ${styles.chipSm} ${distance === opt.value ? styles.chipActive : ''}`}
                onClick={() => setDistance(opt.value)}
              >
                <Text className={styles.chipText}>{opt.label}</Text>
              </View>
            ))}
            <View
              className={`${styles.chip} ${styles.chipSm} ${onlyApplicable ? styles.chipActive : ''}`}
              onClick={() => setOnlyApplicable((v) => !v)}
            >
              <Text className={styles.chipText}>只看可申请</Text>
            </View>
          </View>
        </View>

        {/* 拒定位：选择城市引导 */}
        {locMode === 'city' && !city && (
          <View className={styles.cityGuide}>
            <Text className={styles.cityGuideText}>未开启定位，选择一个城市开始浏览吧</Text>
            <Picker
              mode='selector'
              range={CITIES}
              onChange={(e) => setCity(CITIES[Number(e.detail.value)])}
            >
              <View className={styles.cityPickBtn}>
                <Text className={styles.cityPickText}>选择城市 ›</Text>
              </View>
            </Picker>
          </View>
        )}

        {/* 资料未完善提示 */}
        {showProfileGuide && (
          <View
            className={styles.profileTip}
            onClick={() => Taro.navigateTo({ url: '/pages/profileEdit/profileEdit?from=home' })}
          >
            <Text className={styles.profileTipText}>完善资料后才能申请搭子哦，去完善 ›</Text>
          </View>
        )}

        {/* 请求流 */}
        <ScrollView scrollY className={styles.feed} enhanced showScrollbar={false}>
          {list.map((item) => (
            <RequestCard key={item.id} item={item} onClick={goToDetail} />
          ))}
          {!loading && list.length === 0 && locMode !== 'none' && (
            <View className={styles.empty}>
              <Text className={styles.emptyIcon}>🧭</Text>
              <Text className={styles.emptyText}>暂无符合条件的请求，换个筛选试试</Text>
            </View>
          )}
          {loading && (
            <View className={styles.loading}>
              <Text className={styles.loadingText}>加载中…</Text>
            </View>
          )}
          {finished && list.length > 0 && (
            <View className={styles.loading}>
              <Text className={styles.loadingText}>— 到底啦 —</Text>
            </View>
          )}
          <View className={styles.bottomSpace} />
        </ScrollView>
      </View>
      <CustomTabBar />
    </PageLayout>
  );
}
