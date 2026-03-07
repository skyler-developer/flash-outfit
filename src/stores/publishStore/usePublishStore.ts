import { create } from 'zustand';
import type { ActivityType, QuickOptionType, GenderType } from '@/pages/publish/constants';
import { AGE_RANGE, VALIDATION_MESSAGES } from '@/pages/publish/constants';
import Taro from '@tarojs/taro';

// 时间选择类型
export interface TimeSelection {
  date: string;
  time: string;
  quickOption?: QuickOptionType | null;
}

// 位置信息类型
export interface LocationInfo {
  name: string;
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
  setCurrentLocation: (loc: LocationInfo | null) => void;
  setDestination: (dest: string) => void;

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

  // 表单状态
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;

  // 表单验证
  validateForm: () => { valid: boolean; message?: string };

  // 提交表单
  submitForm: () => Promise<boolean>;

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
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  setDestination: (dest) => set({ destination: dest }),

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

  // 表单状态
  isSubmitting: false,
  setIsSubmitting: (value) => set({ isSubmitting: value }),

  // 表单验证
  validateForm: () => {
    const state = get();

    if (!state.activityType) {
      return { valid: false, message: VALIDATION_MESSAGES.activityTypeRequired };
    }
    if (!state.selectedTime) {
      return { valid: false, message: VALIDATION_MESSAGES.timeRequired };
    }
    if (!state.destination.trim()) {
      return { valid: false, message: VALIDATION_MESSAGES.destinationRequired };
    }
    if (state.description.length < 10) {
      return { valid: false, message: VALIDATION_MESSAGES.descriptionMinLength };
    }
    if (state.images.length === 0) {
      return { valid: false, message: VALIDATION_MESSAGES.imageRequired };
    }

    return { valid: true };
  },

  // 提交表单
  submitForm: async () => {
    const state = get();
    const validation = state.validateForm();

    if (!validation.valid) {
      Taro.showToast({
        title: validation.message || '请完善表单信息',
        icon: 'none',
      });
      return false;
    }

    set({ isSubmitting: true });

    try {
      // TODO: 调用实际的发布接口
      // const response = await publishActivity({
      //   activityType: state.activityType,
      //   time: state.selectedTime,
      //   location: { current: state.currentLocation, destination: state.destination },
      //   partnerPreference: { gender: state.gender, ageRange: state.ageRange },
      //   description: state.description,
      //   images: state.images,
      // });

      // 模拟接口调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Taro.showToast({
        title: '发布成功',
        icon: 'success',
      });

      // 重置表单
      get().resetForm();

      // 延迟跳转
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/home/home' });
      }, 1500);

      return true;
    } catch (error) {
      Taro.showToast({
        title: '发布失败，请重试',
        icon: 'none',
      });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // 重置表单
  resetForm: () => set({
    activityType: null,
    selectedTime: null,
    currentLocation: null,
    destination: '',
    gender: 'all',
    ageRange: [AGE_RANGE.min, AGE_RANGE.default[1]],
    description: '',
    images: [],
    isSubmitting: false,
  }),
}));
