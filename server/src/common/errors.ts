import { HttpException, HttpStatus } from '@nestjs/common';

/** 业务错误码（与 docs/api-contract.md §9 对齐） */
export const ErrorCode = {
  PARAM_INVALID: { code: 4000, http: HttpStatus.BAD_REQUEST, message: '参数校验失败' },
  UNAUTHORIZED: { code: 4010, http: HttpStatus.UNAUTHORIZED, message: '请重新登录' },
  FORBIDDEN: { code: 4030, http: HttpStatus.FORBIDDEN, message: '无权操作' },
  NOT_FOUND: { code: 4040, http: HttpStatus.NOT_FOUND, message: '资源不存在' },
  NO_WECHAT_ID: { code: 4100, http: HttpStatus.BAD_REQUEST, message: '请先在"我的"中填写微信号' },
  TIME_PAST: { code: 4101, http: HttpStatus.BAD_REQUEST, message: '活动时间需晚于当前时间' },
  PREFERENCE_MISMATCH: { code: 4102, http: HttpStatus.BAD_REQUEST, message: '不符合该活动的伙伴偏好' },
  PHOTO_INVALID: { code: 4103, http: HttpStatus.BAD_REQUEST, message: '照片须为本系统上传' },
  NOT_PUBLISHER: { code: 4104, http: HttpStatus.FORBIDDEN, message: '仅发布者可操作' },
  NOT_APPLICABLE: { code: 4110, http: HttpStatus.BAD_REQUEST, message: '该活动已结束或已过期' },
  FULL: { code: 4111, http: HttpStatus.BAD_REQUEST, message: '该活动已成组满员' },
  DUPLICATE_APPLY: { code: 4112, http: HttpStatus.BAD_REQUEST, message: '已申请，请勿重复提交' },
  ALREADY_HANDLED: { code: 4113, http: HttpStatus.BAD_REQUEST, message: '该申请已审批' },
  CONTENT_RISK: { code: 4200, http: HttpStatus.BAD_REQUEST, message: '内容含违规信息，请修改' },
  SERVER_ERROR: { code: 5000, http: HttpStatus.INTERNAL_SERVER_ERROR, message: '服务开小差了，请稍后再试' },
} as const;

type ErrorDef = { code: number; http: HttpStatus; message: string };

/** 业务异常：携带契约中的业务码 */
export class BusinessException extends HttpException {
  readonly bizCode: number;

  constructor(def: ErrorDef, message?: string) {
    super({ code: def.code, message: message || def.message }, def.http);
    this.bizCode = def.code;
  }
}

export function err(def: ErrorDef, message?: string): BusinessException {
  return new BusinessException(def, message);
}
