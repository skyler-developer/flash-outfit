import { View, Text } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import CustomTabBar from "@/customTabBar";
import { useTabsStore } from "@/stores/tabsStore/useTabsStore";
import styles from "./mine.module.scss";

export default function Mine() {
    const { setSelectedTab } = useTabsStore();
    useLoad(() => {
        setSelectedTab(4);
    });

    return (
        <View className={styles.mine}>
            <Text className={styles.title}>我的</Text>
            <CustomTabBar />
        </View>
    );
}
