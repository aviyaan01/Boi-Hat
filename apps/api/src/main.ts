import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ResponseInterceptor } from './common/response.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { validateEnvironmentOrExit } from './common/env.validation';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

async function bootstrap() {
  // Validate environment variables early; fail fast on invalid configuration
  validateEnvironmentOrExit();

  const logger = new Logger('BoiHatAPI');
  const app = await NestFactory.create(AppModule);

  // Trust proxy for real client IP extraction behind Render / reverse proxies / CDNs
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Security & performance middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Enable graceful shutdown hooks for clean database and connection pooling termination
  app.enableShutdownHooks();

  // CORS configuration
  const rawCors = process.env.CORS_ORIGINS;
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = rawCors ? rawCors.split(',').map((s) => s.trim()).filter(Boolean) : [];

  app.enableCors({
    origin: (origin, callback) => {
      // In dev, or non-browser clients (mobile app, curl, adb) where origin is undefined, permit request
      if (!origin || !isProduction) {
        return callback(null, true);
      }
      if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  // Global pipes, interceptors, and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || process.env.API_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Boi-Hat API server running on 0.0.0.0:${port} (Mode: ${process.env.NODE_ENV || 'development'})`);
}

bootstrap();
