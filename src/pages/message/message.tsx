import { View, Text } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import { useTabsStore } from "@/stores/tabsStore/useTabsStore";
import CustomTabBar from "@/customTabBar";
import styles from "./message.module.scss";

export default function Message() {
  const { setSelectedTab } = useTabsStore();
  useLoad(() => {
    setSelectedTab(1);
  });

  return (
    <View className={styles.message}>
      <Text className={styles.title}>消息</Text>
      <CustomTabBar />
    </View>
  );
}
