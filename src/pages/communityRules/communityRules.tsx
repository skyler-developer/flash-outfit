import Taro from '@tarojs/taro';
import { ScrollView, Text, View } from '@tarojs/components';
import PageLayout from '@/components/pageLayout';
import { BackButton } from '@/components/headerBar';
import styles from './communityRules.module.scss';

const RULES: { title: string; items: string[] }[] = [
  {
    title: '一、真实与诚信',
    items: [
      '发布请求请使用真实活动信息，照片需为本人或真实场景，禁止盗图',
      '资料页请如实填写性别与出生年份，成组体验依赖彼此信任',
      '严禁发布虚假、欺诈类内容，违者封禁',
    ],
  },
  {
    title: '二、安全第一',
    items: [
      '首次见面建议选择公共场所，并告知亲友行程',
      '涉及费用的活动请提前沟通分摊方式，AA 制为默认共识',
      '如遇骚扰或人身威胁，请保留证据并立即报警，同时向我们举报',
    ],
  },
  {
    title: '三、尊重彼此',
    items: [
      '拒绝他人申请时请友善，勿使用侮辱性言语',
      '成组后请守时赴约，临时有事请提前告知',
      '尊重每位搭子的边界与意愿，不强行发展其他关系',
    ],
  },
  {
    title: '四、平台规范',
    items: [
      '禁止发布违法违规、色情低俗、赌博诈骗等内容',
      '禁止发布商业广告、代购、招聘等信息',
      '闪搭是兴趣活动搭伴工具，请勿用于其他用途',
    ],
  },
];

export default function CommunityRules() {
  return (
    <PageLayout>
      <View className={styles.page}>
        <View className={styles.header}>
          <BackButton onClick={() => Taro.navigateBack()} />
          <Text className={styles.headerTitle}>社区公约</Text>
        </View>

        <ScrollView scrollY className={styles.body}>
          <View className={styles.intro}>
            <Text className={styles.introTitle}>欢迎来到闪搭</Text>
            <Text className={styles.introText}>
              闪搭帮助你快速找到一起做某件事的人。为了大家的安全与体验，请共同遵守以下公约。
            </Text>
          </View>

          {RULES.map((section) => (
            <View key={section.title} className={styles.section}>
              <Text className={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item, idx) => (
                <View key={idx} className={styles.ruleItem}>
                  <Text className={styles.ruleDot}>·</Text>
                  <Text className={styles.ruleText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}

          <View className={styles.footer}>
            <Text className={styles.footerText}>本公约自发布之日起生效，闪搭保留最终解释权</Text>
          </View>
        </ScrollView>
      </View>
    </PageLayout>
  );
}
