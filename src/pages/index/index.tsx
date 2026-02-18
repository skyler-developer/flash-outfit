import { View, Text } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import styles from "./index.module.scss";

export default function Index() {
    useLoad(() => {
        console.log("Page loaded.");
    });

    return (
        <View className={styles.index}>
            <Text className={styles.title}>Hello world!</Text>
            <Text className={styles.text}>Hello world!</Text>
            <Text className={styles.text}>Hello world!</Text>
        </View>
    );
}
