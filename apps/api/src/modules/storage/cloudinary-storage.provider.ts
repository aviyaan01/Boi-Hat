import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { StorageProvider, StorageUploadResult } from './storage.interface';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ?? process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY') ?? process.env.CLOUDINARY_API_KEY;
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET') ?? process.env.CLOUDINARY_API_SECRET;
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL') ?? process.env.CLOUDINARY_URL;

    if (cloudinaryUrl) {
      cloudinary.config({ cloudinary_url: cloudinaryUrl });
    } else if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  async uploadImage(file: Express.Multer.File, folder = 'boihat/books'): Promise<StorageUploadResult> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No image file buffer provided for upload');
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(file.mimetype)) {
      throw new BadRequestException('শুধুমাত্র JPG, PNG এবং WebP ছবি আপলোড করা যাবে (Only JPG, PNG, and WebP images allowed)');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট (MB) হতে পারে (Image size must not exceed 5MB)');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            { width: 1200, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`);
            return reject(new ServiceUnavailableException('ছবি আপলোড করা যায়নি, কিছুক্ষণ পর চেষ্টা করুন'));
          }

          resolve({
            url: result.secure_url || result.url,
            publicId: result.public_id,
          });
        },
      );

      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (err: any) {
      this.logger.error(`Failed to delete Cloudinary asset ${publicId}: ${err.message}`);
      return false;
    }
  }
}
