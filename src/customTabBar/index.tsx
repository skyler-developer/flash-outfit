import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import styles from "./index.module.scss";
import { TAB_LIST } from "./config/tabList";
import { useTabsStore } from "@/stores/tabsStore/useTabsStore";

export default function CustomTabBar() {
  const selected = useTabsStore((s) => s.selectedTab);

  const handleSwitch = (item: (typeof TAB_LIST)[0]) => {
    Taro.switchTab({ url: `/${item.pagePath}` });
  };

  return (
    <View className={styles.tabBar}>
      <View className={styles.tabBarInner}>
        {TAB_LIST.map((item) => (
          <View
            key={item.pagePath}
            className={`${styles.tabItem} ${item.index === 2 ? styles.centerItem : ""} ${selected === item.index ? styles.selected : ""}`}
            onClick={() => handleSwitch(item)}
          >
            <View className={styles.iconWrap}>
              {/* 中间发布按钮：凸起悬浮 */}
              {item.index === 2 ? (
                <View className={styles.centerIcon}>
                  <Text className={styles.centerText}>+</Text>
                </View>
              ) : (
                <View className={styles.normalIcon}>
                  <Text className={styles.iconText}>{item.text.charAt(0)}</Text>
                </View>
              )}
            </View>
            <Text className={styles.label}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
