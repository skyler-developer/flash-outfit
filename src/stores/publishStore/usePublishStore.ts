import { create } from 'zustand';
import type { ActivityType, GenderType, TimeSelection } from '@/pages/publish/constants';
import { AGE_RANGE, VALIDATION_MESSAGES } from '@/pages/publish/constants';

export type { TimeSelection };

// 位置信息类型
export interface LocationInfo {
  name: string;
  city: string;
  region?: [string, string, string];
  latitude?: number;
  longitude?: number;
}

// 发布表单状态
export interface PublishStore {
  // 活动类型
  activityType: ActivityType | null;
  setActivityType: (type: ActivityType) => void;

  // 时间选择
  selectedTime: TimeSelection | null;
  setSelectedTime: (time: TimeSelection | null) => void;

  // 位置信息
  currentLocation: LocationInfo | null;
  destination: string;
  destinationRegion: [string, string, string] | null;
  setCurrentLocation: (loc: LocationInfo | null) => void;
  setDestinationRegion: (region: [string, string, string]) => void;

  // 伙伴偏好
  gender: GenderType;
  ageRange: [number, number];
  setGender: (gender: GenderType) => void;
  setAgeRange: (range: [number, number]) => void;

  // 活动描述
  description: string;
  setDescription: (desc: string) => void;

  // 图片列表
  images: string[];
  addImages: (urls: string[]) => void;
  removeImage: (index: number) => void;

  // 成组设置（v1.1 新增字段）
  maxMembers: number;
  autoCloseOnGrouped: boolean;
  setMaxMembers: (n: number) => void;
  setAutoCloseOnGrouped: (v: boolean) => void;

  // 表单状态
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;

  // 表单验证（field 用于定位到不满足条件的表单区域）
  validateForm: () => { valid: boolean; field?: 'activityType' | 'activityTime' | 'destination' | 'description' | 'images'; message?: string };

  // 重置表单
  resetForm: () => void;
}

export const usePublishStore = create<PublishStore>((set, get) => ({
  // 活动类型
  activityType: null,
  setActivityType: (type) => set({ activityType: type }),

  // 时间选择
  selectedTime: null,
  setSelectedTime: (time) => set({ selectedTime: time }),

  // 位置信息
  currentLocation: null,
  destination: '',
  destinationRegion: null,
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  setDestinationRegion: (region) => set({ destinationRegion: region, destination: region.join('') }),

  // 伙伴偏好
  gender: 'all',
  ageRange: [AGE_RANGE.min, AGE_RANGE.default[1]],
  setGender: (gender) => set({ gender }),
  setAgeRange: (range) => set({ ageRange: range }),

  // 活动描述
  description: '',
  setDescription: (desc) => set({ description: desc }),

  // 图片列表
  images: [],
  addImages: (urls) => set((state) => ({ images: [...state.images, ...urls] })),
  removeImage: (index) => set((state) => ({
    images: state.images.filter((_, i) => i !== index),
  })),

  // 成组设置
  maxMembers: 1,
  autoCloseOnGrouped: false,
  setMaxMembers: (n) => set({ maxMembers: n }),
  setAutoCloseOnGrouped: (v) => set({ autoCloseOnGrouped: v }),

  // 表单状态
  isSubmitting: false,
  setIsSubmitting: (value) => set({ isSubmitting: value }),

  // 表单验证（field 用于定位到不满足条件的表单区域）
  validateForm: () => {
    const state = get();

    if (!state.activityType) {
      return { valid: false, field: 'activityType', message: VALIDATION_MESSAGES.activityTypeRequired };
    }
    if (!state.selectedTime?.date || !state.selectedTime.time) {
      return { valid: false, field: 'activityTime', message: VALIDATION_MESSAGES.timeRequired };
    }
    const activityTime = new Date(`${state.selectedTime.date}T${state.selectedTime.time}:00`);
    if (Number.isNaN(activityTime.getTime()) || activityTime.getTime() <= Date.now()) {
      return { valid: false, field: 'activityTime', message: VALIDATION_MESSAGES.timeMustBeFuture };
    }
    if (!state.currentLocation?.city) {
      return { valid: false, field: 'destination', message: '请定位或选择当前所在地区' };
    }
    if (!state.destinationRegion) {
      return { valid: false, field: 'destination', message: VALIDATION_MESSAGES.destinationRequired };
    }
    if (state.description.length < 10) {
      return { valid: false, field: 'description', message: VALIDATION_MESSAGES.descriptionMinLength };
    }
    if (state.images.length === 0) {
      return { valid: false, field: 'images', message: VALIDATION_MESSAGES.imageRequired };
    }

    return { valid: true };
  },

  // 重置表单
  resetForm: () => set({
    activityType: null,
    selectedTime: null,
    currentLocation: null,
    destination: '',
    destinationRegion: null,
    gender: 'all',
    ageRange: [AGE_RANGE.min, AGE_RANGE.default[1]],
    description: '',
    images: [],
    maxMembers: 1,
    autoCloseOnGrouped: false,
    isSubmitting: false,
  }),
}));
