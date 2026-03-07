import { PropsWithChildren } from "react";
import { useLaunch } from "@tarojs/taro";
import systemInfo from "@/utils/systemInfo";
import "./app.scss";

/**
 * 入口组件：负责应用级生命周期（如 useLaunch），不负责页面 DOM。
 * 小程序端只有「当前页面」的组件树会序列化为 WXML，App 的 return 不会出现在页面 DOM 中，
 * 因此在这里包一层 View（如状态栏占位）在真机/模拟器里不会生效。
 * 若需要全局顶部占位（如自定义导航栏时的 statusBar 留白），请在各自页面根节点或使用 PageLayout 包裹。
 */
function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log("App launched.", systemInfo);
  });

  return <>{children}</>;
}

export default App;
