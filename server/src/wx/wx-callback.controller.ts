import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import * as crypto from 'crypto';
import { appConfig } from '../common/config';
import { Public } from '../common/jwt-auth';
import { RawResponse } from '../common/response.interceptor';
import { MediaCheckService } from './media-check.service';

/** 微信事件推送回调（小程序后台「开发 → 开发设置 → 消息推送」配置本地址，数据格式选 JSON） */
@Controller('wx')
@RawResponse()
export class WxCallbackController {
  constructor(private mediaChecks: MediaCheckService) {}

  /** URL 有效性校验：sha1(sort(token, timestamp, nonce)) === signature 时回显 echostr */
  @Public()
  @Get('callback')
  verify(
    @Query('signature') signature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Query('echostr') echostr: string,
  ): string {
    const token = appConfig.wx.callbackToken;
    const hash = crypto
      .createHash('sha1')
      .update([token, timestamp, nonce].sort().join(''))
      .digest('hex');
    if (hash !== signature) return 'fail';
    return echostr ?? '';
  }

  /**
   * 事件推送：wxa_media_check（mediaCheckAsync 异步结果）。
   * 微信要求 5 秒内返回 success（否则重试），故 handler 内只做轻量对账写库。
   */
  @Public()
  @Post('callback')
  async onEvent(@Body() body: unknown): Promise<string> {
    let payload: any = body;
    if (typeof body === 'string') {
      try {
        payload = JSON.parse(body);
      } catch {
        payload = null; // 后台误配为 XML 时无法解析，直接 ack 避免重试风暴
      }
    }
    if (payload?.Event === 'wxa_media_check' && payload.trace_id) {
      await this.mediaChecks.handleCallback({
        trace_id: payload.trace_id,
        result: payload.result,
      });
    }
    return 'success';
  }
}
