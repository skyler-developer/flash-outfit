import { ActivityRequest } from '../entities/request.entity';
import { User, calcAge } from '../entities/user.entity';

export interface ApplicabilityResult {
  applicable: boolean;
  reason: string | null;
}

/**
 * 申请资格静态校验（不含满员/重复申请等 DB 依赖项）。
 * 详情接口用；申请/审批路径在 service 里结合 DB 状态使用。
 */
export function checkPreference(
  viewer: User | null,
  request: ActivityRequest,
): { applicable: boolean; reason: string | null } {
  if (!viewer) return { applicable: false, reason: '未登录' };
  if (request.status !== 'recruiting') {
    return { applicable: false, reason: '该请求已结束' };
  }
  if (new Date(request.activityTime).getTime() <= Date.now()) {
    return { applicable: false, reason: '该请求已过期' };
  }
  if (request.publisherId === viewer.id) {
    return { applicable: false, reason: '不能申请自己发布的请求' };
  }
  if (request.genderPreference !== 'all' && request.genderPreference !== viewer.gender) {
    return { applicable: false, reason: '不符合该请求的性别偏好' };
  }
  if (viewer.birthYear) {
    const age = calcAge(viewer.birthYear);
    if (age < request.ageMin || age > request.ageMax) {
      return {
        applicable: false,
        reason: `该请求期望 ${request.ageMin}-${request.ageMax} 岁的伙伴`,
      };
    }
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
