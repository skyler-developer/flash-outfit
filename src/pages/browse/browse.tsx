import { View, Text } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import styles from "./browse.module.scss";
import Card from "@/components/card";

export default function Browse() {
    useLoad(() => {
        console.log("浏览页面加载");
    });

    return (
        <View className={styles.browse}>
            {/* <Text className={styles.title}>浏览</Text> */}
            <Card image="https://img95.699pic.com/photo/50290/5840.jpg_wh860.jpg" title="标题" content="内容" />
        </View>
    );
}
