import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaCheck } from './media-check.entity';
import { ActivityRequest } from '../entities/request.entity';
import { WxService } from './wx.service';
import { MediaCheckService } from './media-check.service';
import { WxCallbackController } from './wx-callback.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([MediaCheck, ActivityRequest]), NotificationsModule],
  controllers: [WxCallbackController],
  providers: [WxService, MediaCheckService],
  exports: [WxService, MediaCheckService],
})
export class WxModule {}
