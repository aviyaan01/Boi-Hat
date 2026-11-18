import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
import { LocalStorageProvider } from './local-storage.provider';

@Module({
  controllers: [StorageController],
  providers: [CloudinaryStorageProvider, LocalStorageProvider, StorageService],
  exports: [StorageService, CloudinaryStorageProvider, LocalStorageProvider],
})
export class StorageModule {}
