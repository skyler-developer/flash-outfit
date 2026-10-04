// 活动类型（v1.3：扩充至 8 类 + 其他，共 9 项，标签统一两字）
export type ActivityType =
  | 'travel'
  | 'photography'
  | 'sports'
  | 'food'
  | 'show'
  | 'game'
  | 'study'
  | 'outdoor'
  | 'other';

export interface ActivityTypeOption {
  type: ActivityType;
  label: string;
  icon: string; // 占位符，后续替换为实际图标类名
}

export const ACTIVITY_TYPES: ActivityTypeOption[] = [
  { type: 'travel', label: '旅行', icon: '旅' },
  { type: 'photography', label: '摄影', icon: '摄' },
  { type: 'sports', label: '运动', icon: '动' },
  { type: 'food', label: '美食', icon: '美' },
  { type: 'show', label: '观影', icon: '观' },
  { type: 'game', label: '游戏', icon: '戏' },
  { type: 'study', label: '学习', icon: '学' },
  { type: 'outdoor', label: '户外', icon: '野' },
  { type: 'other', label: '其他', icon: '其' },
];

/** 兴趣标签可选项（个人兴趣不含"其他"，对齐需求 §4.9） */
export const INTEREST_TYPES: ActivityTypeOption[] = ACTIVITY_TYPES.filter(
  (t) => t.type !== 'other',
);

/** 活动类型映射（卡片/详情展示用）；新增类型暂无 iconfont，iconClass 留空回退到文字图标 */
export const ACTIVITY_TYPE_MAP: Record<ActivityType, { label: string; icon: string; iconClass: string }> = {
  travel: { label: '旅行', icon: '旅', iconClass: 'icon-flash-outfittravel' },
  photography: { label: '摄影', icon: '摄', iconClass: 'icon-flash-outfitphotography' },
  sports: { label: '运动', icon: '动', iconClass: 'icon-flash-outfitsports' },
  food: { label: '美食', icon: '美', iconClass: '' },
  show: { label: '观影', icon: '观', iconClass: '' },
  game: { label: '游戏', icon: '戏', iconClass: '' },
  study: { label: '学习', icon: '学', iconClass: '' },
  outdoor: { label: '户外', icon: '野', iconClass: '' },
  other: { label: '其他', icon: '其', iconClass: '' },
};

/** 完整时间选择（发布表单使用） */
export interface TimeSelection {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

// 性别偏好
export type GenderType = 'all' | 'female' | 'male';

export interface GenderOption {
  type: GenderType;
  label: string;
}

export const GENDER_OPTIONS: GenderOption[] = [
  { type: 'all', label: '不限' },
  { type: 'female', label: '女' },
  { type: 'male', label: '男' },
];

// 年龄范围配置
export const AGE_RANGE = {
  min: 18,
  max: 60,
  default: [18, 30] as [number, number],
};

// 图片上传配置
export const IMAGE_UPLOAD = {
  maxCount: 6,
  maxSize: 10 * 1024 * 1024, // 10MB
  uploadUrl: '/api/upload/image', // 占位接口
};

// 表单字段标签
export const FORM_LABELS = {
  title: '活动标题',
  activityType: '活动类型',
  activityTime: '活动时间',
  activityLocation: '活动地点',
  partnerPreference: '伙伴偏好',
  activityDescription: '活动描述',
  activityPhotos: '活动照片',
};

// 表单验证消息
export const VALIDATION_MESSAGES = {
  titleRequired: '请输入活动标题（最多50字）',
  activityTypeRequired: '请选择活动类型',
  timeRequired: '请选择活动时间',
  timeMustBeFuture: '请选择未来的活动时间',
  destinationRequired: '请输入目的地',
  descriptionMinLength: '活动描述至少10个字符',
  imageRequired: '请至少上传1张活动照片',
};
