import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';

/** 旁路统一响应信封的路由标记（如微信回调需原样返回 echostr/success） */
export const RAW_RESPONSE_KEY = 'rawResponse';
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);

/** 统一成功响应：{ code: 0, message: 'ok', data } */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const raw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (raw) return next.handle();

    return next.handle().pipe(map((data) => ({ code: 0, message: 'ok', data: data ?? null })));
  }
}
