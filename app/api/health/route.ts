import { NextResponse } from 'next/server';
import { checkRedisHealth } from '@/lib/redis';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    redis: {
      status: 'ok' | 'error' | 'disabled';
      message?: string;
    };
    dify: {
      status: 'ok' | 'error';
      message?: string;
      responseTime?: number;
    };
  };
}

export async function GET() {
  const checks: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    services: {
      redis: {
        status: 'disabled',
      },
      dify: {
        status: 'error',
      },
    },
  };

  // Check Redis
  try {
    const redisHealthy = await checkRedisHealth();
    checks.services.redis = {
      status: redisHealthy ? 'ok' : 'error',
      message: redisHealthy ? 'Connected' : 'Not connected',
    };
  } catch (error) {
    checks.services.redis = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Dify connection
  const difyStartTime = Date.now();
  try {
    const difyBaseUrl = process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'http://localhost:8000/v1';
    const difyApiKey = process.env.NEXT_PUBLIC_DIFY_OUTLINE_KEY;

    if (!difyApiKey) {
      checks.services.dify = {
        status: 'error',
        message: 'API key not configured',
      };
    } else {
      const difyResponse = await fetch(`${difyBaseUrl}/info`, {
        headers: {
          'Authorization': `Bearer ${difyApiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - difyStartTime;

      if (difyResponse.ok) {
        checks.services.dify = {
          status: 'ok',
          message: 'Connected',
          responseTime,
        };
      } else {
        checks.services.dify = {
          status: 'error',
          message: `HTTP ${difyResponse.status}`,
          responseTime,
        };
      }
    }
  } catch (error) {
    checks.services.dify = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Connection failed',
      responseTime: Date.now() - difyStartTime,
    };
  }

  // Determine overall health status
  const redisOk = checks.services.redis.status === 'ok' || checks.services.redis.status === 'disabled';
  const difyOk = checks.services.dify.status === 'ok';

  if (!redisOk || !difyOk) {
    checks.status = 'degraded';
  }

  if (!redisOk && !difyOk) {
    checks.status = 'unhealthy';
  }

  const httpStatus = checks.status === 'healthy' ? 200 : 503;

  return NextResponse.json(checks, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
