import { View, Text } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import CustomTabBar from "@/customTabBar";
import PageLayout from "@/components/pageLayout";
import { useTabsStore } from "@/stores/tabsStore/useTabsStore";
import styles from "./match.module.scss";

export default function Match() {
    const { setSelectedTab } = useTabsStore();
    useLoad(() => {
        setSelectedTab(3);
    });

    return (
        <PageLayout>
            <View className={styles.match}>
                <Text className={styles.title}>匹配</Text>
                <CustomTabBar />
            </View>
        </PageLayout>
    );
}
