import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProduction = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const errorObj = res as Record<string, any>;
        message = Array.isArray(errorObj.message)
          ? errorObj.message.join(', ')
          : errorObj.message || errorObj.error || message;
        code =
          errorObj.code ||
          (status === 404
            ? 'NOT_FOUND'
            : status === 401
              ? 'UNAUTHORIZED'
              : status === 403
                ? 'FORBIDDEN'
                : status === 409
                  ? 'CONFLICT'
                  : 'BAD_REQUEST');
      }
    } else if (exception instanceof Error) {
      // Check for Prisma unique constraint violation (P2002)
      if ((exception as any).code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'CONFLICT';
        const target = (exception as any).meta?.target;
        const targetStr = Array.isArray(target) ? target.join(', ') : 'username or email';
        message = `Resource collision: ${targetStr} already taken`;
      } else {
        this.logger.error(`Unhandled error on ${request.method} ${request.url}: ${exception.stack}`);
        if (isProduction) {
          message = 'An unexpected server error occurred. Please try again later.';
        } else {
          message = exception.message;
        }
      }
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }
}
