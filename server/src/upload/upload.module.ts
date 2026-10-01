import { Module } from '@nestjs/common';
import { UploadController, GeoController } from './upload.controller';

@Module({
  controllers: [UploadController, GeoController],
})
export class UploadModule {}
