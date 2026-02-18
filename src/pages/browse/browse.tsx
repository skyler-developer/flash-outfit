import { View, Text } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import styles from "./browse.module.scss";

export default function Browse() {
    useLoad(() => {
        console.log("浏览页面加载");
    });

    return (
        <View className={styles.browse}>
            <Text className={styles.title}>浏览</Text>
        </View>
    );
}
