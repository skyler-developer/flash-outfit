import { View, Image, Text } from "@tarojs/components";
import styles from "./card.module.scss";

type CardProps = {
  /** 图片地址 */
  image?: string;
  /** 标题文本 */
  title?: string;
  /** 内容文本 */
  content?: string;
};

export default function Card(props: CardProps) {
  const { image, title, content } = props;

  return (
    <View className={styles.card}>
      {image && (
        <Image className={styles.cardImage} src={image} mode="aspectFill" />
      )}
      {title && <Text className={styles.cardTitle}>{title}</Text>}
      {content && <Text className={styles.cardContent}>{content}</Text>}
    </View>
  );
}
