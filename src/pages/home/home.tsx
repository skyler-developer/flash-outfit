import { View } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import CustomTabBar from "@/customTabBar";
import { useTabsStore } from "@/stores/tabsStore/useTabsStore";
import Card from "@/components/card";
import PageLayout from "@/components/pageLayout";
import styles from "./home.module.scss";

export default function Home() {
    const { setSelectedTab } = useTabsStore();
    useLoad(() => {
        setSelectedTab(0);
    });

    return (
        <PageLayout>
            <View className={styles.home}>
                <Card image="https://img95.699pic.com/photo/50290/5840.jpg_wh860.jpg" title="标题" content="内容" />
                <CustomTabBar />
            </View>
        </PageLayout>
    );
}
