import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('CloudinaryStorageProvider', () => {
  let provider: CloudinaryStorageProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryStorageProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'CLOUDINARY_CLOUD_NAME') return 'test-cloud';
              if (key === 'CLOUDINARY_API_KEY') return 'test-key';
              if (key === 'CLOUDINARY_API_SECRET') return 'test-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<CloudinaryStorageProvider>(CloudinaryStorageProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully upload an image and return secure_url & publicId', async () => {
    const mockUploadStream = jest.fn((options, callback) => {
      // Simulate successful upload callback
      process.nextTick(() => {
        callback(null, {
          secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/boihat/books/test.jpg',
          public_id: 'boihat/books/test',
        });
      });
      const stream = require('stream');
      return new stream.Writable({
        write(chunk: any, encoding: any, cb: any) {
          cb();
        },
      });
    });

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(mockUploadStream);

    const fakeFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'book.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake image content'),
      size: 1024,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const result = await provider.uploadImage(fakeFile, 'boihat/books');

    expect(result).toEqual({
      url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/boihat/books/test.jpg',
      publicId: 'boihat/books/test',
    });
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'boihat/books',
        transformation: [
          { width: 1200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      }),
      expect.any(Function),
    );
  });

  it('should reject non-image mime types with BadRequestException', async () => {
    const invalidFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'malicious.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.from('pdf data'),
      size: 1024,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    await expect(provider.uploadImage(invalidFile)).rejects.toThrow(BadRequestException);
  });

  it('should reject files larger than 5MB with BadRequestException', async () => {
    const largeFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'huge.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.alloc(6 * 1024 * 1024),
      size: 6 * 1024 * 1024,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    await expect(provider.uploadImage(largeFile)).rejects.toThrow(BadRequestException);
  });

  it('should delete image from Cloudinary', async () => {
    (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

    const result = await provider.deleteImage('boihat/books/test-id');
    expect(result).toBe(true);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('boihat/books/test-id');
  });
});
