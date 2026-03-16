/**
 * Unified Error Handling
 * Provides consistent error handling across all API routes
 */

import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, { retryAfter });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: any) {
    super(
      `External service error: ${service}`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      true,
      { service, originalError: originalError?.message }
    );
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation timeout: ${operation} (${timeoutMs}ms)`,
      'TIMEOUT_ERROR',
      504,
      true,
      { operation, timeoutMs }
    );
  }
}

/**
 * Handle API errors and return appropriate response
 */
export function handleAPIError(error: unknown): Response {
  // Log error for debugging
  if (error instanceof AppError) {
    console.error(`[${error.code}]`, {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
      {
        status: error.statusCode,
        ...(error instanceof RateLimitError &&
          error.details?.retryAfter && {
            headers: { 'Retry-After': String(error.details.retryAfter) },
          }),
      }
    );
  }

  // Unknown errors
  console.error('[UNKNOWN_ERROR]', error);

  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = error instanceof Error ? error.message : 'Internal server error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  return NextResponse.json(
    {
      error: isDevelopment ? errorMessage : 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(isDevelopment && errorStack && { stack: errorStack }),
    },
    { status: 500 }
  );
}

/**
 * Async error wrapper for API routes
 */
export function asyncHandler<T>(
  handler: (request: Request, context?: any) => Promise<T>
) {
  return async (request: Request, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}

/**
 * Assert condition and throw ValidationError if false
 */
export function assert(
  condition: boolean,
  message: string,
  details?: any
): asserts condition {
  if (!condition) {
    throw new ValidationError(message, details);
  }
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  fields: string[]
): void {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missing }
    );
  }
}
