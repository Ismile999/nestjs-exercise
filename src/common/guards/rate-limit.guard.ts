import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Redis from 'ioredis';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../../common/decorators/rate-limit.decorator';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip;
    const handler = context.getHandler();

    const options: RateLimitOptions = this.reflector.get(RATE_LIMIT_KEY, handler) || { limit: 100, windowMs: 60_000 };
    const key = `rate_limit:${handler.name}:${ip}`;
    const now = Date.now();

    // Use Redis INCR and EXPIRE for atomicity and efficiency
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, options.windowMs);
    }

    if (count > options.limit) {
      // Do not expose IP or internal details
      throw new HttpException(
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Rate limit exceeded',
          message: `You have exceeded the ${options.limit} requests per ${options.windowMs / 1000} seconds limit.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}