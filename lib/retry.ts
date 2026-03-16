/**
 * Retry Mechanism with Exponential Backoff
 * Handles transient failures in external service calls
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  onRetry: () => {},
  shouldRetry: () => true,
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxRetries) {
        throw lastError;
      }

      if (!opts.shouldRetry(lastError)) {
        throw lastError;
      }

      opts.onRetry(attempt + 1, lastError);

      console.warn(
        `[Retry] Attempt ${attempt + 1}/${opts.maxRetries} failed: ${lastError.message}. Retrying in ${delay}ms...`
      );

      await sleep(delay);
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Retry specifically for fetch requests
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, init);

      // Retry on 5xx errors
      if (response.status >= 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    },
    {
      ...options,
      shouldRetry: (error) => {
        // Retry network errors and 5xx errors
        if (error.message.includes('HTTP 5')) return true;
        if (error.message.includes('fetch failed')) return true;
        if (error.message.includes('ECONNREFUSED')) return true;
        if (error.message.includes('ETIMEDOUT')) return true;

        return options?.shouldRetry?.(error) ?? false;
      },
    }
  );
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker<T> {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private fn: () => Promise<T>,
    private options: {
      failureThreshold?: number;
      resetTimeout?: number;
      onStateChange?: (state: 'closed' | 'open' | 'half-open') => void;
    } = {}
  ) {
    this.options.failureThreshold = options.failureThreshold ?? 5;
    this.options.resetTimeout = options.resetTimeout ?? 60000;
  }

  async execute(): Promise<T> {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.options.resetTimeout!) {
        this.setState('half-open');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await this.fn();

      if (this.state === 'half-open') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (
        this.state === 'half-open' ||
        this.failureCount >= this.options.failureThreshold!
      ) {
        this.setState('open');
      }

      throw error;
    }
  }

  private setState(state: 'closed' | 'open' | 'half-open'): void {
    if (this.state !== state) {
      this.state = state;
      this.options.onStateChange?.(state);
      console.log(`[CircuitBreaker] State changed to: ${state}`);
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.setState('closed');
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Example usage with Dify API
 */
export async function callDifyWithRetry(
  url: string,
  apiKey: string,
  body: any
): Promise<any> {
  return retryFetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  }, {
    maxRetries: 3,
    initialDelay: 1000,
    onRetry: (attempt, error) => {
      console.warn(`[Dify] Retry attempt ${attempt}: ${error.message}`);
    },
  });
}
