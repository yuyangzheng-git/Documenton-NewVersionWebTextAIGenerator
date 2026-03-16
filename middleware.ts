import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { apiLimiter, strictLimiter } from './lib/rate-limiter';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip rate limiting for health check
  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  // Get client identifier
  const ip = request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Use strict limiter for sensitive endpoints
  const limiter = pathname.includes('/upload') ||
                  pathname.includes('/export')
    ? strictLimiter
    : apiLimiter;

  const allowed = await limiter.check(ip);

  if (!allowed) {
    const retryAfter = limiter.getRemainingTime(ip);

    return NextResponse.json(
      {
        error: 'Too many requests',
        code: 'RATE_LIMIT_ERROR',
        retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + retryAfter * 1000),
        }
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
