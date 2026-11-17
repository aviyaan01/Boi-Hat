import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ResponseInterceptor } from './common/response.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('BoiHatAPI');
  const app = await NestFactory.create(AppModule);

  // Trust proxy for real client IP extraction behind reverse proxies/CDNs
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      // Allow localhost frontend and mobile/PWA origins
      callback(null, true);
    },
    credentials: true,
  });

  // Global pipes, interceptors, and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || process.env.API_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Boi-Hat API server running at http://0.0.0.0:${port} (listening on all interfaces)`);
}

bootstrap();

