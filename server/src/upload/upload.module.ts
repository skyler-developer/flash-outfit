import { Module } from '@nestjs/common';
import { UploadController, GeoController } from './upload.controller';
import { StorageService } from './storage.service';

@Module({
  controllers: [UploadController, GeoController],
  providers: [StorageService],
})
export class UploadModule {}
