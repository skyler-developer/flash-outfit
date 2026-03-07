import { View, Text } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import CustomTabBar from "@/customTabBar";
import PageLayout from "@/components/pageLayout";
import { useTabsStore } from "@/stores/tabsStore/useTabsStore";
import styles from "./publish.module.scss";

export default function Publish() {
    const { setSelectedTab } = useTabsStore();
    useLoad(() => {
        setSelectedTab(2);
    });

    return (
        <PageLayout>
            <View className={styles.publish}>
                <Text className={styles.title}>发布</Text>
                <CustomTabBar />
            </View>
        </PageLayout>
    );
}
