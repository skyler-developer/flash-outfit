import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { TAB_LIST_COMPLETED } from "./config/tabList";
import { useTabsStore } from "@/stores/tabsStore/useTabsStore";

const CN = {
  root: "custom-tab-bar",
  inner: "custom-tab-bar__inner",
  item: "custom-tab-bar__item",
  itemCenter: "custom-tab-bar__item--center",
  selected: "selected",
  iconWrap: "custom-tab-bar__icon-wrap",
  normalIcon: "custom-tab-bar__normal-icon",
  centerIcon: "custom-tab-bar__center-icon",
  centerText: "custom-tab-bar__center-text",
  label: "custom-tab-bar__label",
  iconText: "custom-tab-bar__icon-text",
};

export default function CustomTabBar() {
  const { selectedTab, setSelectedTab } = useTabsStore();

  const handleSwitch = (item: (typeof TAB_LIST_COMPLETED)[0]) => {
    Taro.switchTab({ url: `/${item.pagePath}` });
    setSelectedTab(item.index);
  };

  const calculateIconColor = (item: (typeof TAB_LIST_COMPLETED)[0]) => {
    if (item.className === "icon-flash-outfitpublish") {
      return "#fff";
    }
    if (selectedTab === item.index) {
      return "#F49D25";
    }
    return "#94A3B8";
  };

  const publishIconStyle = {
    width: "56px",
    height: "56px",
    backgroundColor: "#F49D25",
    borderRadius: "50%",
    boxShadow:
      "0px 10px 15px -3px rgba(244, 157, 37, 0.4), 0px 4px 6px -4px rgba(244, 157, 37, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const publishTextStyle = {
    fontWeight: 700,
    fontSize: "30rpx",
    color: "#F49D25",
    marginTop: "10rpx",
  };

  return (
    <View className={CN.root}>
      <View className={CN.inner}>
        {TAB_LIST_COMPLETED.map((item) => (
          <View
            key={item.pagePath}
            className={`${CN.item} ${selectedTab === item.index ? CN.selected : ""} ${item.className === "icon-flash-outfitpublish" ? CN.itemCenter : ""}`}
            onClick={() => handleSwitch(item)}
          >
            <View
              className={`iconfont ${item.className}`}
              style={{
                fontSize: "24px",
                color: calculateIconColor(item),
                ...(item.className === "icon-flash-outfitpublish"
                  ? publishIconStyle
                  : {}),
              }}
            ></View>
            <Text
              className={CN.label}
              style={{
                color: selectedTab === item.index ? "#F49D25" : "#94A3B8",
                fontWeight: selectedTab === item.index ? 500 : 400,
                ...(item.className === "icon-flash-outfitpublish"
                  ? publishTextStyle
                  : {}),
              }}
            >
              {item.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
