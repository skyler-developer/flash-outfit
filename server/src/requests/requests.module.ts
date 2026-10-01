import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityRequest } from '../entities/request.entity';
import { User } from '../entities/user.entity';
import { Application } from '../entities/application.entity';
import { RequestsController } from './requests.controller';
import { MyRequestsController } from './my-requests.controller';
import { RequestsService } from './requests.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityRequest, User, Application]), NotificationsModule],
  controllers: [RequestsController, MyRequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
