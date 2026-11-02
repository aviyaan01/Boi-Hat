import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@boi-hat/shared-types';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // If response already has the envelope structure, return as is
        if (res && typeof res === 'object' && 'success' in res) {
          return res;
        }

        // If the handler returned an object with data and meta
        if (res && typeof res === 'object' && ('data' in res || 'meta' in res)) {
          return {
            success: true,
            data: res.data ?? res,
            meta: res.meta,
          };
        }

        return {
          success: true,
          data: res,
        };
      }),
    );
  }
}
