import { TAB_LIST } from "@/customTabBar/config/tabList";

export default defineAppConfig({
  pages: ["pages/home/home", "pages/message/message", "pages/publish/publish", "pages/match/match", "pages/mine/mine"],
  window: {
    navigationStyle: "custom",
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "闪搭",
    navigationBarTextStyle: "black",
  },
  tabBar: {
    custom: true,
    color: "#7A7E83",
    selectedColor: "#3cc51f",
    borderStyle: "black",
    backgroundColor: "#ffffff",
    list: TAB_LIST,
  },
});
