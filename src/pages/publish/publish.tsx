import { View, Text } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import CustomTabBar from "@/customTabBar";
import { setSelected } from "@/customTabBar/tabBarStore";
import styles from "./publish.module.scss";

export default function Publish() {
    useLoad(() => {
        setSelected(2);
    });

    return (
        <View className={styles.publish}>
            <Text className={styles.title}>发布</Text>
            <CustomTabBar />
        </View>
    );
}
