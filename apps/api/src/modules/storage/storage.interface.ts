export interface StorageUploadResult {
  url: string;
  publicId: string;
}

export interface StorageProvider {
  uploadImage(file: Express.Multer.File, folder?: string): Promise<StorageUploadResult>;
  deleteImage(publicId: string): Promise<boolean>;
}
