import { View, Text } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import styles from "./mine.module.scss";

export default function Mine() {
    useLoad(() => {
        console.log("我的页面加载");
    });

    return (
        <View className={styles.mine}>
            <Text className={styles.title}>我的</Text>
        </View>
    );
}
