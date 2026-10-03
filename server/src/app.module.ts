import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ActivityRequest } from './entities/request.entity';
import { Application } from './entities/application.entity';
import { Notification } from './entities/notification.entity';
import { MediaCheck } from './wx/media-check.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RequestsModule } from './requests/requests.module';
import { ApplicationsModule } from './applications/applications.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadModule } from './upload/upload.module';
import { WxModule } from './wx/wx.module';
import { JwtAuthGuard } from './common/jwt-auth';
import { appConfig } from './common/config';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      appConfig.db.type === 'mysql'
        ? {
            type: 'mysql',
            host: appConfig.db.mysql.host,
            port: appConfig.db.mysql.port,
            username: appConfig.db.mysql.username,
            password: appConfig.db.mysql.password,
            database: appConfig.db.mysql.database,
            entities: [User, ActivityRequest, Application, Notification, MediaCheck],
            synchronize: appConfig.db.synchronize,
          }
        : {
            type: 'better-sqlite3',
            database: 'flash-outfit.sqlite',
            entities: [User, ActivityRequest, Application, Notification, MediaCheck],
            synchronize: appConfig.db.synchronize,
          },
    ),
    AuthModule,
    UsersModule,
    RequestsModule,
    ApplicationsModule,
    NotificationsModule,
    UploadModule,
    WxModule,
  ],
  providers: [JwtAuthGuard],
})
export class AppModule {}
