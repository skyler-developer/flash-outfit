import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/** 统一异常响应：业务码 + message + data:null */
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      // BusinessException：body 为 { code, message }
      if (typeof body === 'object' && body !== null && 'code' in body && 'message' in body) {
        const b = body as { code: number; message: string };
        if (b.code >= 4000 && b.code < 5000) {
          return res.status(exception.getStatus()).json({ code: b.code, message: b.message, data: null });
        }
      }
      // class-validator 参数错误 → 4000
      if (exception.getStatus() === HttpStatus.BAD_REQUEST) {
        let msg = '参数校验失败';
        const rb = exception.getResponse();
        if (typeof rb === 'object' && rb !== null && Array.isArray((rb as any).message)) {
          const first = (rb as any).message[0];
          msg = typeof first === 'string' ? first : msg;
        }
        return res.status(400).json({ code: 4000, message: msg, data: null });
      }
      return res.status(exception.getStatus()).json({
        code: exception.getStatus() === HttpStatus.UNAUTHORIZED ? 4010 : 5000,
        message: exception.message || '服务异常',
        data: null,
      });
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return res.status(500).json({ code: 5000, message: '服务开小差了，请稍后再试', data: null });
  }
}
