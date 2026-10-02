import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import systemInfo from '@/utils/systemInfo';
import styles from './headerBar.module.scss';

export function BackButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
    return (
        <View className={`${styles.backControl} ${className}`} onClick={onClick}>
            <Text className={styles.backGlyph}>‹</Text>
        </View>
    );
}

export interface HeaderBarProps {
    title: string;
    /** 左上角返回按钮（‹），优先于 showClose */
    showBack?: boolean;
    showClose?: boolean;
    showHelp?: boolean;
    onBack?: () => void;
    onClose?: () => void;
    onHelp?: () => void;
}

export default function HeaderBar({
    title,
    showBack = false,
    showClose = true,
    showHelp = true,
    onBack,
    onClose,
    onHelp,
}: HeaderBarProps) {
    const handleBack = () => {
        if (onBack) {
            onBack();
            return;
        }
        // 发布页为 tabBar 页，无返回栈时回到首页
        const pages = Taro.getCurrentPages();
        if (pages.length > 1) {
            Taro.navigateBack();
        } else {
            Taro.switchTab({ url: '/pages/home/home' });
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            // 默认返回上一页或跳转到首页
            const pages = Taro.getCurrentPages();
            if (pages.length > 1) {
                Taro.navigateBack();
            } else {
                Taro.switchTab({ url: '/pages/home/home' });
            }
        }
    };

    const handleHelp = () => {
        if (onHelp) {
            onHelp();
        } else {
            Taro.showModal({
                title: '帮助',
                content: '发布活动请求后，系统会为您匹配合适的伙伴。请确保信息真实有效。',
                showCancel: false,
            });
        }
    };

    // 计算导航栏高度
    const navBarHeight = systemInfo.menuButtonHeight + (systemInfo.menuButtonTop - systemInfo.statusBarHeight) * 2;

    return (
        <View
          className={styles.headerBar}
          style={{
                paddingTop: `${systemInfo.statusBarHeight}px`,
                height: `${navBarHeight}px`,
                // 加上2px的下间距，过渡自然一些
                paddingBottom: '2px'
            }}
        >
            <View className={styles.content} style={{ height: `${navBarHeight}px` }}>
                {showBack ? (
                    <BackButton className={styles.backBtn} onClick={handleBack} />
                ) : showClose ? (
                    <View className={styles.closeBtn} onClick={handleClose}>
                        <Text className={styles.closeIcon}>×</Text>
                    </View>
                ) : null}
                <Text className={styles.title}>{title}</Text>
                {showHelp && (
                    <View className={styles.helpBtn} onClick={handleHelp}>
                        <Text className={styles.closeIcon}>?</Text>
                    </View>
                )}
            </View>
        </View>
    );
}
