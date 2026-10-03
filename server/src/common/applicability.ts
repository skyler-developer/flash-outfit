import { ActivityRequest } from '../entities/request.entity';
import { User } from '../entities/user.entity';

export interface ApplicabilityResult {
  applicable: boolean;
  reason: string | null;
}

/**
 * 详情页申请资格的基础校验（不含重复申请等 DB 依赖项）。
 */
export function checkPreference(
  viewer: User | null,
  request: ActivityRequest,
): { applicable: boolean; reason: string | null } {
  if (!viewer) return { applicable: false, reason: '未登录' };
  if (request.status !== 'recruiting') {
    return { applicable: false, reason: '该请求已结束' };
  }
  if (request.reviewStatus !== 'pass') {
    return { applicable: false, reason: '该请求尚未通过审核' };
  }
  if (request.publisherId === viewer.id) {
    return { applicable: false, reason: '不能申请自己发布的请求' };
  }
  return { applicable: true, reason: null };
}

export function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

/** MVP 内容安全：简易敏感词过滤（上线后由 msgSecCheck 等价能力替换） */
export function containsSensitive(text: string): boolean {
  const words = ['微信加我', '博彩', '贷款', '代开发票', '刷单', '兼职日结', '招嫖', '约炮'];
  return words.some((w) => text.includes(w));
}
