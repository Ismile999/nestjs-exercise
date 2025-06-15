import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async set(key: string, value: any, ttl = 300): Promise<void> {
    await this.cacheManager.set(key, value, ttl * 1000); // Convert seconds to ms
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.cacheManager.get<T>(key);
    return value ?? null;
  }

  async del(key: string): Promise<boolean> {
    const existed = await this.cacheManager.get(key);
    if (existed !== undefined) {
      await this.cacheManager.del(key);
      return true;
    }
    return false;
  }

  async reset(): Promise<void> {
    // Use type assertion for Redis compatibility
    await (this.cacheManager as any).reset();
  }
}