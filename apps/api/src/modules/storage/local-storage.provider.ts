import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StorageProvider, StorageUploadResult } from './storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadImage(file: Express.Multer.File, folder = 'boihat/books'): Promise<StorageUploadResult> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No image file buffer provided for upload');
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(file.mimetype)) {
      throw new BadRequestException('শুধুমাত্র JPG, PNG এবং WebP ছবি আপলোড করা যাবে');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট (MB) হতে পারে');
    }

    const targetSubdir = path.join(this.uploadDir, folder.replace(/[^a-zA-Z0-9_-]/g, '_'));
    if (!fs.existsSync(targetSubdir)) {
      fs.mkdirSync(targetSubdir, { recursive: true });
    }

    const ext = file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg';
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(targetSubdir, filename);

    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`Saved local file to ${filePath}`);

    const relativePath = path.relative(this.uploadDir, filePath).replace(/\\/g, '/');
    return {
      url: `/uploads/${relativePath}`,
      publicId: relativePath,
    };
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
