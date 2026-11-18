import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider, StorageUploadResult } from './storage.interface';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
import { LocalStorageProvider } from './local-storage.provider';

@Injectable()
export class StorageService implements StorageProvider, OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private activeProvider: StorageProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudinaryProvider: CloudinaryStorageProvider,
    private readonly localProvider: LocalStorageProvider,
  ) {
    this.activeProvider = this.localProvider;
  }

  onModuleInit() {
    const isProduction = (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV) === 'production';
    const providerName = (
      this.configService.get<string>('STORAGE_PROVIDER') ??
      process.env.STORAGE_PROVIDER ??
      (isProduction ? 'cloudinary' : 'local')
    ).toLowerCase();

    if (providerName === 'cloudinary') {
      this.activeProvider = this.cloudinaryProvider;
      this.logger.log('✓ StorageService active provider: Cloudinary');
    } else {
      if (isProduction) {
        this.logger.warn('WARNING: Running local disk storage in production! Local disk is ephemeral on Render.');
      }
      this.activeProvider = this.localProvider;
      this.logger.log('StorageService active provider: Local Disk');
    }
  }

  async uploadImage(file: Express.Multer.File, folder = 'boihat/books'): Promise<StorageUploadResult> {
    return this.activeProvider.uploadImage(file, folder);
  }

  async deleteImage(publicId: string): Promise<boolean> {
    return this.activeProvider.deleteImage(publicId);
  }
}
