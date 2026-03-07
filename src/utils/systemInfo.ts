import Taro from "@tarojs/taro";

interface SystemInfo {
  /** 设备平台，如 "ios" | "android" | "devtools" */
  platform: string;
  /** 屏幕宽度，单位 px */
  screenWidth: number;
  /** 屏幕高度，单位 px */
  screenHeight: number;
  /** 可使用窗口宽度（不含窗口外的区域），单位 px */
  windowWidth: number;
  /** 可使用窗口高度（不含状态栏、导航栏等），单位 px */
  windowHeight: number;
  /** 状态栏高度（刘海/电量条区域），单位 px，用于自定义导航栏布局 */
  statusBarHeight: number;
  /** 右上角胶囊按钮高度，单位 px */
  menuButtonHeight: number;
  /** 右上角胶囊按钮上边界距屏幕顶部的距离，单位 px，用于计算导航栏高度与留白 */
  menuButtonTop: number;
}

export const getSystemInfo = (): SystemInfo => {
  const systemInfo = Taro.getSystemInfoSync();
  const menuButtonInfo = Taro.getMenuButtonBoundingClientRect();
  return {
    platform: systemInfo.platform,
    screenWidth: systemInfo.screenWidth,
    screenHeight: systemInfo.screenHeight,
    windowWidth: systemInfo.windowWidth,
    windowHeight: systemInfo.windowHeight,
    statusBarHeight: systemInfo.statusBarHeight || 0,
    menuButtonHeight: menuButtonInfo.height || 0,
    menuButtonTop: menuButtonInfo.top || 0,
  };
};

const systemInfo = getSystemInfo();
export default systemInfo;
