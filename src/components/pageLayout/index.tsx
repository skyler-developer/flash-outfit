import { PropsWithChildren } from "react";
import { View } from "@tarojs/components";
import systemInfo from "@/utils/systemInfo";

/**
 * 页面级布局：为自定义导航栏时预留状态栏高度，保证内容不被遮挡。
 * 因小程序端 App 组件的 return 不参与页面 DOM，需在各自页面使用此组件包裹内容。
 */
export default function PageLayout({ children }: PropsWithChildren) {
  return (
    <View style={{ paddingTop: `${systemInfo.statusBarHeight}px` }}>
      {children}
    </View>
  );
}
