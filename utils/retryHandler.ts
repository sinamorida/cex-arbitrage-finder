import { CexInfo } from '../types';
import { globalErrorHandler, ErrorType } from './errorHandler';

/**
 * تنظیمات retry
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // میلی‌ثانیه
  maxDelay: number; // حداکثر تاخیر
  backoffMultiplier: number;
  jitter: boolean; // اضافه کردن تصادفی بودن به تاخیر
}

/**
 * وضعیت Circuit Breaker
 */
export enum CircuitState {
  CLOSED = 'closed',     // عادی
  OPEN = 'open',         // خراب - درخواست‌ها رد می‌شوند
  HALF_OPEN = 'half_open' // در حال تست
}

/**
 * تنظیمات Circuit Breaker
 */
export interface CircuitBreakerConfig {
  failureThreshold: number; // تعداد خطاهای متوالی برای باز کردن circuit
  recoveryTimeout: number; // زمان انتظار قبل از تست مجدد (میلی‌ثانیه)
  successThreshold: number; // تعداد موفقیت‌های متوالی برای بستن circuit
}

/**
 * آمار Circuit Breaker
 */
interface CircuitStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
}

/**
 * کلاس Circuit Breaker
 */
class CircuitBreaker {
  private stats: CircuitStats;
  private config: CircuitBreakerConfig;
  private exchangeId: string;

  constructor(exchangeId: string, config: CircuitBreakerConfig) {
    this.exchangeId = exchangeId;
    this.config = config;
    this.stats = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0
    };
  }

  /**
   * بررسی امکان اجرای درخواست
   */
  canExecute(): boolean {
    const now = Date.now();

    switch (this.stats.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // بررسی زمان recovery
        if (now - this.stats.lastFailureTime >= this.config.recoveryTimeout) {
          this.stats.state = CircuitState.HALF_OPEN;
          this.stats.successCount = 0;
          console.log(`🔄 Circuit breaker for ${this.exchangeId} moved to HALF_OPEN`);
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  /**
   * ثبت موفقیت
   */
  recordSuccess(): void {
    this.stats.lastSuccessTime = Date.now();
    this.stats.failureCount = 0;

    if (this.stats.state === CircuitState.HALF_OPEN) {
      this.stats.successCount++;
      if (this.stats.successCount >= this.config.successThreshold) {
        this.stats.state = CircuitState.CLOSED;
        console.log(`✅ Circuit breaker for ${this.exchangeId} moved to CLOSED`);
      }
    }
  }

  /**
   * ثبت خطا
   */
  recordFailure(): void {
    this.stats.lastFailureTime = Date.now();
    this.stats.failureCount++;
    this.stats.successCount = 0;

    if (this.stats.state === CircuitState.CLOSED || this.stats.state === CircuitState.HALF_OPEN) {
      if (this.stats.failureCount >= this.config.failureThreshold) {
        this.stats.state = CircuitState.OPEN;
        console.log(`❌ Circuit breaker for ${this.exchangeId} moved to OPEN`);
      }
    }
  }

  /**
   * دریافت وضعیت فعلی
   */
  getState(): CircuitState {
    return this.stats.state;
  }

  /**
   * دریافت آمار
   */
  getStats(): CircuitStats {
    return { ...this.stats };
  }

  /**
   * ریست کردن circuit breaker
   */
  reset(): void {
    this.stats = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0
    };
    console.log(`🔄 Circuit breaker for ${this.exchangeId} reset`);
  }
}

/**
 * مدیریت Circuit Breaker برای صرافی‌ها
 */
class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 دقیقه
    successThreshold: 3
  };

  /**
   * دریافت circuit breaker برای صرافی
   */
  getBreaker(exchangeId: string): CircuitBreaker {
    if (!this.breakers.has(exchangeId)) {
      this.breakers.set(exchangeId, new CircuitBreaker(exchangeId, this.defaultConfig));
    }
    return this.breakers.get(exchangeId)!;
  }

  /**
   * دریافت وضعیت تمام circuit breaker ها
   */
  getAllStates(): { [exchangeId: string]: CircuitState } {
    const states: { [exchangeId: string]: CircuitState } = {};
    this.breakers.forEach((breaker, exchangeId) => {
      states[exchangeId] = breaker.getState();
    });
    return states;
  }

  /**
   * ریست کردن همه circuit breaker ها
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

/**
 * کلاس مدیریت Retry
 */
export class RetryHandler {
  private circuitManager = new CircuitBreakerManager();
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  };

  /**
   * محاسبه تاخیر برای retry بعدی
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    delay = Math.min(delay, config.maxDelay);

    // اضافه کردن jitter برای جلوگیری از thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * بررسی قابلیت retry خطا
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // خطاهای قابل retry
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'rate limit',
      'too many requests',
      'service unavailable',
      'internal server error',
      'bad gateway',
      'gateway timeout'
    ];

    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * اجرای عملیات با retry و circuit breaker
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    exchangeId: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const circuitBreaker = this.circuitManager.getBreaker(exchangeId);
    
    // بررسی circuit breaker
    if (!circuitBreaker.canExecute()) {
      const error = new Error(`Circuit breaker is OPEN for ${exchangeId}`);
      globalErrorHandler.logError(error, { exchangeId, circuitState: circuitBreaker.getState() });
      throw error;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // ثبت موفقیت در circuit breaker
        circuitBreaker.recordSuccess();
        
        if (attempt > 0) {
          console.log(`✅ Operation succeeded for ${exchangeId} after ${attempt} retries`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // ثبت خطا در circuit breaker
        circuitBreaker.recordFailure();
        
        // بررسی قابلیت retry
        if (attempt === finalConfig.maxRetries || !this.isRetryableError(lastError)) {
          console.error(`❌ Operation failed for ${exchangeId} after ${attempt + 1} attempts:`, lastError.message);
          break;
        }
        
        // محاسبه تاخیر و انتظار
        const delay = this.calculateDelay(attempt, finalConfig);
        console.warn(`⚠️ Attempt ${attempt + 1} failed for ${exchangeId}, retrying in ${delay}ms:`, lastError.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // ثبت خطای نهایی
    globalErrorHandler.logError(lastError!, { 
      exchangeId, 
      attempts: finalConfig.maxRetries + 1,
      circuitState: circuitBreaker.getState()
    });
    
    throw lastError!;
  }

  /**
   * اجرای عملیات با timeout
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    exchangeId?: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        const error = new Error(`Operation timed out after ${timeoutMs}ms${exchangeId ? ` for ${exchangeId}` : ''}`);
        if (exchangeId) {
          globalErrorHandler.logError(error, { exchangeId, timeout: timeoutMs });
        }
        reject(error);
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * دریافت وضعیت circuit breaker ها
   */
  getCircuitStates(): { [exchangeId: string]: CircuitState } {
    return this.circuitManager.getAllStates();
  }

  /**
   * ریست کردن circuit breaker خاص
   */
  resetCircuitBreaker(exchangeId: string): void {
    const breaker = this.circuitManager.getBreaker(exchangeId);
    breaker.reset();
  }

  /**
   * ریست کردن همه circuit breaker ها
   */
  resetAllCircuitBreakers(): void {
    this.circuitManager.resetAll();
  }
}

// نمونه سراسری مدیریت retry
export const globalRetryHandler = new RetryHandler();