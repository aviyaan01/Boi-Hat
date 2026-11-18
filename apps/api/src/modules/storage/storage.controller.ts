import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('uploads')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'boihat/books',
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.storageService.uploadImage(file, folder);
  }

  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder = 'boihat/books',
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    if (files.length > 10) {
      throw new BadRequestException('সর্বোচ্চ ১০টি ছবি আপলোড করা যাবে (Maximum 10 images allowed)');
    }

    const results = await Promise.all(
      files.map((file) => this.storageService.uploadImage(file, folder)),
    );

    return {
      count: results.length,
      images: results,
    };
  }
}
