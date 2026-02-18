import { View, Text } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import styles from "./create.module.scss";

export default function Create() {
    useLoad(() => {
        console.log("创建页面加载");
    });

    return (
        <View className={styles.create}>
            <Text className={styles.title}>创建</Text>
        </View>
    );
}
