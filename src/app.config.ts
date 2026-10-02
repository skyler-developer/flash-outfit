import { TAB_LIST } from "@/customTabBar/config/tabList";

export default defineAppConfig({
  pages: [
    "pages/home/home",
    "pages/publish/publish",
    "pages/mine/mine",
    "pages/message/message",
    "pages/detail/detail",
    "pages/profileEdit/profileEdit",
    "pages/myRequests/myRequests",
    "pages/manageRequest/manageRequest",
    "pages/myApplications/myApplications",
    "pages/communityRules/communityRules",
  ],
  window: {
    navigationStyle: "custom",
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "闪搭",
    navigationBarTextStyle: "black",
  },
  /** 定位隐私接口声明（微信基础库要求，未声明 getLocation 会直接 fail） */
  permission: {
    "scope.userLocation": {
      desc: "用于按距离为你推荐附近的搭子请求",
    },
  },
  requiredPrivateInfos: ["getLocation"],
  tabBar: {
    custom: true,
    color: "#7A7E83",
    selectedColor: "#F49D25",
    borderStyle: "black",
    backgroundColor: "#ffffff",
    list: TAB_LIST,
  },
});
