import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  // Utility to redact sensitive fields
  private redact(obj: any): any {
    const sensitiveFields = ['password', 'token', 'authorization', 'cookie'];
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.redact(item));
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = sensitiveFields.includes(key.toLowerCase()) ? '***REDACTED***' : this.redact(obj[key]);
      return acc;
    }, {} as any);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, ip, headers, user, body } = req;
    const userId = user?.id || 'anonymous';
    const userAgent = headers['user-agent'];
    const now = Date.now();

    // Redact sensitive info from headers and body
    const safeHeaders = this.redact(headers);
    const safeBody = this.redact(body);

    this.logger.log(
      `[REQUEST] ${method} ${url} | IP: ${ip} | User: ${userId} | UA: ${userAgent} | Headers: ${JSON.stringify(
        safeHeaders,
      )} | Body: ${JSON.stringify(safeBody)}`
    );

    return next.handle().pipe(
      tap({
        next: (val) => {
          const res = context.switchToHttp().getResponse();
          const statusCode = res?.statusCode || 200;
          this.logger.log(
            `[RESPONSE] ${method} ${url} | Status: ${statusCode} | User: ${userId} | ${Date.now() - now}ms`
          );
        },
        error: (err) => {
          const res = context.switchToHttp().getResponse();
          const statusCode = res?.statusCode || 500;
          this.logger.error(
            `[ERROR] ${method} ${url} | Status: ${statusCode} | User: ${userId} | ${Date.now() - now}ms | Error: ${err.message}`
          );
        },
      }),
    );
  }
}