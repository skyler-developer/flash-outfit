import { View, Text } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import CustomTabBar from "@/customTabBar";
import styles from "./message.module.scss";

export default function Message() {

    return (
        <View className={styles.message}>
            <Text className={styles.title}>消息</Text>
            <CustomTabBar />
        </View>
    );
}
