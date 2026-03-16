/**
 * Rate Limiter
 * Simple in-memory rate limiting with sliding window
 */

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async check(identifier: string): Promise<boolean> {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || now >= record.resetTime) {
      // New window or expired
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (record.count >= this.config.max) {
      // Rate limit exceeded
      return false;
    }

    // Increment count
    record.count++;
    this.store.set(identifier, record);
    return true;
  }

  getRemainingTime(identifier: string): number {
    const record = this.store.get(identifier);
    if (!record) return 0;

    const remaining = record.resetTime - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Pre-configured rate limiters
export const apiLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  max: 60, // 60 requests per minute
});

export const strictLimiter = new RateLimiter({
  windowMs: 60000,
  max: 10, // 10 requests per minute for sensitive operations
});

export const generousLimiter = new RateLimiter({
  windowMs: 60000,
  max: 120, // 120 requests per minute for read operations
});
