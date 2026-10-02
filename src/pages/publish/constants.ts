// 活动类型
export type ActivityType = 'travel' | 'photography' | 'sports';

export interface ActivityTypeOption {
  type: ActivityType;
  label: string;
  icon: string; // 占位符，后续替换为实际图标类名
}

export const ACTIVITY_TYPES: ActivityTypeOption[] = [
  { type: 'travel', label: '旅行', icon: '旅' },
  { type: 'photography', label: '摄影', icon: '摄' },
  { type: 'sports', label: '运动', icon: '动' },
];

/** 活动类型映射（卡片/详情展示用） */
export const ACTIVITY_TYPE_MAP: Record<ActivityType, { label: string; icon: string; iconClass: string }> = {
  travel: { label: '旅行', icon: '旅', iconClass: 'icon-flash-outfittravel' },
  photography: { label: '摄影', icon: '摄', iconClass: 'icon-flash-outfitphotography' },
  sports: { label: '运动', icon: '动', iconClass: 'icon-flash-outfitsports' },
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
  activityType: '活动类型',
  activityTime: '活动时间',
  activityLocation: '活动地点',
  partnerPreference: '伙伴偏好',
  activityDescription: '活动描述',
  activityPhotos: '活动照片',
};

// 表单验证消息
export const VALIDATION_MESSAGES = {
  activityTypeRequired: '请选择活动类型',
  timeRequired: '请选择活动时间',
  timeMustBeFuture: '请选择未来的活动时间',
  destinationRequired: '请输入目的地',
  descriptionMinLength: '活动描述至少10个字符',
  imageRequired: '请至少上传1张活动照片',
};
