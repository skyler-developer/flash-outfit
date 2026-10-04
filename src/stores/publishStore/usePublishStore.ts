import { create } from 'zustand';
import type { ActivityType, GenderType, TimeSelection } from '@/pages/publish/constants';
import type { RequestDetail } from '@/api/requestApi';
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

export interface PublishFormValues {
  activityType: ActivityType | null;
  selectedTime: TimeSelection | null;
  currentLocation: LocationInfo | null;
  destination: string;
  destinationRegion: [string, string, string] | null;
  gender: GenderType;
  ageRange: [number, number];
  description: string;
  images: string[];
  maxMembers: number;
  autoCloseOnGrouped: boolean;
}

/** 从当前发布草稿中提取表单字段，编辑现有请求时用于恢复草稿。 */
export function getPublishFormValues(state: PublishStore): PublishFormValues {
  const { activityType, selectedTime, currentLocation, destination, destinationRegion,
    gender, ageRange, description, images, maxMembers, autoCloseOnGrouped } = state;
  return { activityType, selectedTime, currentLocation, destination, destinationRegion,
    gender, ageRange, description, images, maxMembers, autoCloseOnGrouped };
}

// 发布表单状态
export interface PublishStore extends PublishFormValues {
  setActivityType: (type: ActivityType) => void;
  setSelectedTime: (time: TimeSelection | null) => void;
  setCurrentLocation: (loc: LocationInfo | null) => void;
  setDestinationRegion: (region: [string, string, string]) => void;
  setGender: (gender: GenderType) => void;
  setAgeRange: (range: [number, number]) => void;
  setDescription: (desc: string) => void;
  addImages: (urls: string[]) => void;
  removeImage: (index: number) => void;
  setMaxMembers: (n: number) => void;
  setAutoCloseOnGrouped: (v: boolean) => void;

  // 表单状态
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;

  // 表单验证（field 用于定位到不满足条件的表单区域）
  validateForm: () => { valid: boolean; field?: 'activityType' | 'activityTime' | 'destination' | 'description' | 'images'; message?: string };

  // 编辑请求时回填，退出编辑后恢复原发布草稿
  setFormValues: (values: PublishFormValues) => void;
  fillFromRequest: (detail: RequestDetail) => void;

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
    const activityTime = new Date(`${state.selectedTime.date}T${state.selectedTime.time}:00+08:00`);
    if (Number.isNaN(activityTime.getTime()) || activityTime.getTime() <= Date.now()) {
      return { valid: false, field: 'activityTime', message: VALIDATION_MESSAGES.timeMustBeFuture };
    }
    if (!state.currentLocation?.city) {
      return { valid: false, field: 'destination', message: '请定位或选择当前所在地区' };
    }
    if (!state.destination.trim()) {
      return { valid: false, field: 'destination', message: VALIDATION_MESSAGES.destinationRequired };
    }
    if (state.description.trim().length < 10) {
      return { valid: false, field: 'description', message: VALIDATION_MESSAGES.descriptionMinLength };
    }
    if (state.images.length === 0) {
      return { valid: false, field: 'images', message: VALIDATION_MESSAGES.imageRequired };
    }

    return { valid: true };
  },

  setFormValues: (values) => set({ ...values, isSubmitting: false }),
  fillFromRequest: (detail) => {
    const activityTime = new Date(new Date(detail.activityTime).getTime() + 8 * 3600_000).toISOString();
    set({
      activityType: detail.type,
      selectedTime: {
        date: activityTime.slice(0, 10),
        time: activityTime.slice(11, 16),
      },
      currentLocation: {
        name: detail.location.city,
        city: detail.location.city,
        latitude: detail.location.lat ?? undefined,
        longitude: detail.location.lng ?? undefined,
      },
      destination: detail.destination,
      // 历史请求仅保存了目的地文本，没有完整的省/市/区三级数组。
      destinationRegion: null,
      gender: detail.genderPreference,
      ageRange: detail.ageRange,
      description: detail.description,
      images: detail.photos,
      maxMembers: detail.maxMembers,
      autoCloseOnGrouped: detail.autoCloseOnGrouped,
      isSubmitting: false,
    });
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
