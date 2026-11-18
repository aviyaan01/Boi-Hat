import { Logger } from '@nestjs/common';

export function validateEnvironmentOrExit(): void {
  const logger = new Logger('EnvValidator');
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim().length === 0) {
    if (isProduction) {
      errors.push('DATABASE_URL is required in production (must be a valid Neon/PostgreSQL connection string).');
    }
  }

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (isProduction) {
    if (!accessSecret || accessSecret.length < 32) {
      errors.push('JWT_ACCESS_SECRET must be at least 32 characters long in production.');
    }
    if (!refreshSecret || refreshSecret.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters long in production.');
    }
    if (accessSecret && refreshSecret && accessSecret === refreshSecret) {
      errors.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct and different from each other in production.');
    }
  }

  const emailProvider = (process.env.EMAIL_PROVIDER || (isProduction ? 'brevo' : 'console')).toLowerCase();
  if (emailProvider === 'brevo') {
    if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY.trim().length === 0) {
      if (isProduction) {
        errors.push('BREVO_API_KEY is required in production when EMAIL_PROVIDER=brevo.');
      }
    }
  }

  const storageProvider = (process.env.STORAGE_PROVIDER || (isProduction ? 'cloudinary' : 'local')).toLowerCase();
  if (storageProvider === 'cloudinary') {
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME.trim().length === 0) {
      if (isProduction) errors.push('CLOUDINARY_CLOUD_NAME is required in production when STORAGE_PROVIDER=cloudinary.');
    }
    if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY.trim().length === 0) {
      if (isProduction) errors.push('CLOUDINARY_API_KEY is required in production when STORAGE_PROVIDER=cloudinary.');
    }
    if (!process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET.trim().length === 0) {
      if (isProduction) errors.push('CLOUDINARY_API_SECRET is required in production when STORAGE_PROVIDER=cloudinary.');
    }
  }

  if (errors.length > 0) {
    logger.error('================================================================================');
    logger.error('CRITICAL CONFIGURATION ERROR: SERVER CANNOT START DUE TO INVALID ENVIRONMENT:');
    errors.forEach((err, idx) => logger.error(`  ${idx + 1}. ${err}`));
    logger.error('================================================================================');
    process.exit(1);
  }

  logger.log(`✓ Environment validation passed (Mode: ${process.env.NODE_ENV || 'development'}).`);
}
