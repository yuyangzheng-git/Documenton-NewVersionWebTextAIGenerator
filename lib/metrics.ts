/**
 * Performance Metrics Collection
 * Tracks API performance, cache efficiency, and error rates
 */

export interface MetricValue {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p95?: number;
  p99?: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

export interface ErrorMetrics {
  total: number;
  byCode: Record<string, number>;
  byEndpoint: Record<string, number>;
}

export interface APIMetrics {
  endpoint: string;
  method: string;
  responseTime: MetricValue;
  statusCodes: Record<string, number>;
  totalRequests: number;
  errorRate: number;
}

interface HistogramBucket {
  values: number[];
  timestamp: number;
}

class MetricsCollector {
  private responseTimeBuckets: Map<string, HistogramBucket[]> = new Map();
  private counters: Map<string, number> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;
  private errors: Map<string, number> = new Map();
  private errorsByEndpoint: Map<string, number> = new Map();
  private statusCodes: Map<string, Map<string, number>> = new Map();

  private readonly MAX_BUCKET_AGE = 3600000; // 1 hour
  private readonly MAX_BUCKETS = 60; // Keep last 60 buckets
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval in browser/Node
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 300000); // 5 minutes
    }
  }

  /**
   * Record API request duration
   */
  recordResponseTime(endpoint: string, method: string, duration: number, statusCode: number): void {
    const key = `${method}:${endpoint}`;

    // Record response time
    if (!this.responseTimeBuckets.has(key)) {
      this.responseTimeBuckets.set(key, []);
    }

    const buckets = this.responseTimeBuckets.get(key)!;
    const now = Date.now();

    // Add to current bucket or create new one
    if (buckets.length === 0 || now - buckets[buckets.length - 1].timestamp > 60000) {
      buckets.push({ values: [duration], timestamp: now });

      // Limit bucket count
      if (buckets.length > this.MAX_BUCKETS) {
        buckets.shift();
      }
    } else {
      buckets[buckets.length - 1].values.push(duration);
    }

    // Record status code
    if (!this.statusCodes.has(key)) {
      this.statusCodes.set(key, new Map());
    }
    const codes = this.statusCodes.get(key)!;
    codes.set(String(statusCode), (codes.get(String(statusCode)) || 0) + 1);

    // Increment counter
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
  }

  /**
   * Record cache hit
   */
  recordCacheHit(key?: string): void {
    this.cacheHits++;
    if (key) {
      this.counters.set(`cache:hit:${key}`, (this.counters.get(`cache:hit:${key}`) || 0) + 1);
    }
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(key?: string): void {
    this.cacheMisses++;
    if (key) {
      this.counters.set(`cache:miss:${key}`, (this.counters.get(`cache:miss:${key}`) || 0) + 1);
    }
  }

  /**
   * Record error
   */
  recordError(code: string, endpoint?: string): void {
    this.errors.set(code, (this.errors.get(code) || 0) + 1);

    if (endpoint) {
      this.errorsByEndpoint.set(endpoint, (this.errorsByEndpoint.get(endpoint) || 0) + 1);
    }
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    const total = this.cacheHits + this.cacheMisses;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
      totalRequests: total,
    };
  }

  /**
   * Get error metrics
   */
  getErrorMetrics(): ErrorMetrics {
    const byCode: Record<string, number> = {};
    this.errors.forEach((count, code) => {
      byCode[code] = count;
    });

    const byEndpoint: Record<string, number> = {};
    this.errorsByEndpoint.forEach((count, endpoint) => {
      byEndpoint[endpoint] = count;
    });

    const total = Array.from(this.errors.values()).reduce((sum, count) => sum + count, 0);

    return {
      total,
      byCode,
      byEndpoint,
    };
  }

  /**
   * Get API metrics for specific endpoint
   */
  getAPIMetrics(endpoint: string, method: string): APIMetrics | null {
    const key = `${method}:${endpoint}`;
    const buckets = this.responseTimeBuckets.get(key);

    if (!buckets || buckets.length === 0) {
      return null;
    }

    // Aggregate all values
    const allValues = buckets.flatMap(b => b.values).sort((a, b) => a - b);

    if (allValues.length === 0) {
      return null;
    }

    const sum = allValues.reduce((a, b) => a + b, 0);
    const count = allValues.length;
    const min = allValues[0];
    const max = allValues[allValues.length - 1];
    const avg = sum / count;
    const p95 = this.percentile(allValues, 0.95);
    const p99 = this.percentile(allValues, 0.99);

    // Get status codes
    const codes = this.statusCodes.get(key);
    const statusCodesObj: Record<string, number> = {};
    if (codes) {
      codes.forEach((count, code) => {
        statusCodesObj[code] = count;
      });
    }

    // Calculate error rate
    const errorCount = Object.entries(statusCodesObj)
      .filter(([code]) => parseInt(code) >= 400)
      .reduce((sum, [, count]) => sum + count, 0);
    const totalRequests = this.counters.get(key) || 0;
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

    return {
      endpoint,
      method,
      responseTime: { count, sum, min, max, avg, p95, p99 },
      statusCodes: statusCodesObj,
      totalRequests,
      errorRate,
    };
  }

  /**
   * Get all API metrics
   */
  getAllAPIMetrics(): APIMetrics[] {
    const metrics: APIMetrics[] = [];

    this.responseTimeBuckets.forEach((_, key) => {
      const [method, ...endpointParts] = key.split(':');
      const endpoint = endpointParts.join(':');
      const metric = this.getAPIMetrics(endpoint, method);
      if (metric) {
        metrics.push(metric);
      }
    });

    return metrics;
  }

  /**
   * Get summary of all metrics
   */
  getSummary(): {
    cache: CacheMetrics;
    errors: ErrorMetrics;
    apis: APIMetrics[];
    uptime: number;
  } {
    return {
      cache: this.getCacheMetrics(),
      errors: this.getErrorMetrics(),
      apis: this.getAllAPIMetrics(),
      uptime: process.uptime ? process.uptime() : 0,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.responseTimeBuckets.clear();
    this.counters.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors.clear();
    this.errorsByEndpoint.clear();
    this.statusCodes.clear();
  }

  /**
   * Cleanup old buckets
   */
  private cleanup(): void {
    const now = Date.now();

    this.responseTimeBuckets.forEach((buckets, key) => {
      const filtered = buckets.filter(b => now - b.timestamp < this.MAX_BUCKET_AGE);
      if (filtered.length === 0) {
        this.responseTimeBuckets.delete(key);
      } else {
        this.responseTimeBuckets.set(key, filtered);
      }
    });
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

/**
 * Middleware helper to track API metrics
 */
export function trackAPIMetrics(
  endpoint: string,
  method: string,
  fn: () => Promise<Response>
): Promise<Response> {
  const startTime = Date.now();

  return fn()
    .then(response => {
      const duration = Date.now() - startTime;
      metrics.recordResponseTime(endpoint, method, duration, response.status);
      return response;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      const statusCode = error.statusCode || 500;
      metrics.recordResponseTime(endpoint, method, duration, statusCode);
      metrics.recordError(error.code || 'UNKNOWN_ERROR', endpoint);
      throw error;
    });
}

/**
 * Cache wrapper with metrics
 */
export async function withCacheMetrics<T>(
  key: string,
  fn: () => Promise<T>,
  getCached: () => Promise<T | null>,
  setCached: (value: T) => Promise<void>
): Promise<T> {
  const cached = await getCached();

  if (cached !== null) {
    metrics.recordCacheHit(key);
    return cached;
  }

  metrics.recordCacheMiss(key);
  const value = await fn();
  await setCached(value);
  return value;
}

export default metrics;
