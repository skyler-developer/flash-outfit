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

  return (
    <View className={CN.root}>
      <View className={CN.inner}>
        {TAB_LIST_COMPLETED.map((item) => (
          <View
            key={item.pagePath}
            className={`${CN.item} ${selectedTab === item.index ? CN.selected : ""}`}
            onClick={() => handleSwitch(item)}
          >
            <View
              className={`iconfont ${item.className}`}
              style={{
                fontSize: "24px",
                color: selectedTab === item.index ? "#F49D25" : "#94A3B8",
              }}
            ></View>
            <Text
              className={CN.label}
              style={{
                color: selectedTab === item.index ? "#F49D25" : "#94A3B8",
                fontWeight: selectedTab === item.index ? 500 : 400,
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
