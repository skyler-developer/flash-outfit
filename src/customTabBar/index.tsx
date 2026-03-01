import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { TAB_LIST } from "./config/tabList";
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
  const selected = useTabsStore((s) => s.selectedTab);

  const handleSwitch = (item: (typeof TAB_LIST)[0]) => {
    Taro.switchTab({ url: `/${item.pagePath}` });
  };

  return (
    <View className={CN.root}>
      <View className={CN.inner}>
        {TAB_LIST.map((item) => (
          <View
            key={item.pagePath}
            className={`${CN.item} ${item.index === 2 ? CN.itemCenter : ""} ${selected === item.index ? CN.selected : ""}`}
            onClick={() => handleSwitch(item)}
          >
            <View className={CN.iconWrap}>
              {item.index === 2 ? (
                <View className={CN.centerIcon}>
                  <Text className={CN.centerText}>+</Text>
                </View>
              ) : (
                <View className={CN.normalIcon}>
                  <Text className={CN.iconText}>{item.text.charAt(0)}</Text>
                </View>
              )}
            </View>
            <Text className={CN.label}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
