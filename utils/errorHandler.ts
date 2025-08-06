import { CexInfo } from '../types';

/**
 * انواع خطاها
 */
export enum ErrorType {
  NETWORK_ERROR = 'network',
  API_ERROR = 'api',
  CALCULATION_ERROR = 'calculation',
  VALIDATION_ERROR = 'validation',
  RATE_LIMIT_ERROR = 'rate_limit',
  DATA_ERROR = 'data',
  CORS_ERROR = 'cors',
  TIMEOUT_ERROR = 'timeout'
}

/**
 * سطح شدت خطا
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * اطلاعات خطا
 */
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  context?: any;
  timestamp: number;
  exchange?: CexInfo;
  retryable: boolean;
  suggestions: string[];
}

/**
 * آمار خطاها
 */
export interface ErrorStats {
  total: number;
  byType: { [key in ErrorType]?: number };
  bySeverity: { [key in ErrorSeverity]?: number };
  byExchange: { [exchangeId: string]: number };
  recentErrors: ErrorInfo[];
}

/**
 * کلاس مدیریت خطا
 */
export class ErrorHandler {
  private errors: ErrorInfo[] = [];
  private maxErrorHistory = 100;

  /**
   * تشخیص نوع خطا
   */
  private detectErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('cors') || message.includes('cross-origin')) {
      return ErrorType.CORS_ERROR;
    }
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return ErrorType.TIMEOUT_ERROR;
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return ErrorType.RATE_LIMIT_ERROR;
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK_ERROR;
    }
    
    if (message.includes('api') || message.includes('invalid response')) {
      return ErrorType.API_ERROR;
    }
    
    if (message.includes('validation') || message.includes('invalid data')) {
      return ErrorType.VALIDATION_ERROR;
    }
    
    if (message.includes('calculation') || message.includes('math')) {
      return ErrorType.CALCULATION_ERROR;
    }
    
    return ErrorType.DATA_ERROR;
  }

  /**
   * تعیین شدت خطا
   */
  private determineSeverity(errorType: ErrorType, context?: any): ErrorSeverity {
    switch (errorType) {
      case ErrorType.CORS_ERROR:
      case ErrorType.RATE_LIMIT_ERROR:
        return ErrorSeverity.HIGH;
      
      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT_ERROR:
        return ErrorSeverity.MEDIUM;
      
      case ErrorType.API_ERROR:
      case ErrorType.DATA_ERROR:
        return ErrorSeverity.MEDIUM;
      
      case ErrorType.VALIDATION_ERROR:
        return ErrorSeverity.LOW;
      
      case ErrorType.CALCULATION_ERROR:
        return ErrorSeverity.HIGH;
      
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * تعیین قابلیت تکرار درخواست
   */
  private isRetryable(errorType: ErrorType): boolean {
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT_ERROR:
      case ErrorType.RATE_LIMIT_ERROR:
        return true;
      
      case ErrorType.CORS_ERROR:
      case ErrorType.API_ERROR:
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.CALCULATION_ERROR:
      case ErrorType.DATA_ERROR:
        return false;
      
      default:
        return false;
    }
  }

  /**
   * ایجاد پیشنهادات حل مشکل
   */
  private generateSuggestions(errorType: ErrorType, exchange?: CexInfo): string[] {
    const suggestions: string[] = [];
    
    switch (errorType) {
      case ErrorType.CORS_ERROR:
        suggestions.push('استفاده از پروکسی CORS یا سرور میانی');
        suggestions.push('فعال کردن حالت دمو برای دسترسی به داده‌های شبیه‌سازی شده');
        suggestions.push('بررسی تنظیمات مرورگر و غیرفعال کردن موقت CORS');
        break;
      
      case ErrorType.RATE_LIMIT_ERROR:
        suggestions.push('کاهش فرکانس درخواست‌ها');
        suggestions.push('استفاده از کلیدهای API متعدد');
        suggestions.push('پیاده‌سازی صف درخواست با تاخیر');
        break;
      
      case ErrorType.NETWORK_ERROR:
        suggestions.push('بررسی اتصال اینترنت');
        suggestions.push('تلاش مجدد پس از چند ثانیه');
        suggestions.push('استفاده از VPN در صورت محدودیت جغرافیایی');
        break;
      
      case ErrorType.TIMEOUT_ERROR:
        suggestions.push('افزایش زمان timeout');
        suggestions.push('بررسی سرعت اتصال اینترنت');
        suggestions.push('تلاش در زمان‌های کم ترافیک');
        break;
      
      case ErrorType.API_ERROR:
        suggestions.push('بررسی وضعیت API صرافی');
        suggestions.push('بررسی صحت پارامترهای درخواست');
        suggestions.push('مراجعه به مستندات API صرافی');
        break;
      
      case ErrorType.VALIDATION_ERROR:
        suggestions.push('بررسی فرمت داده‌های ورودی');
        suggestions.push('اعمال فیلترهای اعتبارسنجی بیشتر');
        break;
      
      case ErrorType.CALCULATION_ERROR:
        suggestions.push('بررسی صحت داده‌های ورودی محاسبات');
        suggestions.push('اعمال بررسی‌های اضافی برای جلوگیری از تقسیم بر صفر');
        break;
      
      default:
        suggestions.push('تلاش مجدد پس از چند لحظه');
        suggestions.push('بررسی لاگ‌های سیستم برای جزئیات بیشتر');
    }
    
    if (exchange) {
      suggestions.push(`بررسی وضعیت سرویس ${exchange.name}`);
    }
    
    return suggestions;
  }

  /**
   * ثبت خطا
   */
  public logError(error: Error, context?: any, exchange?: CexInfo): ErrorInfo {
    const errorType = this.detectErrorType(error);
    const severity = this.determineSeverity(errorType, context);
    const retryable = this.isRetryable(errorType);
    const suggestions = this.generateSuggestions(errorType, exchange);

    const errorInfo: ErrorInfo = {
      type: errorType,
      severity,
      message: error.message,
      context,
      timestamp: Date.now(),
      exchange,
      retryable,
      suggestions
    };

    this.errors.push(errorInfo);
    
    // محدود کردن تاریخچه خطاها
    if (this.errors.length > this.maxErrorHistory) {
      this.errors = this.errors.slice(-this.maxErrorHistory);
    }

    // لاگ کردن در کنسول
    const logLevel = severity === ErrorSeverity.CRITICAL ? 'error' : 
                    severity === ErrorSeverity.HIGH ? 'error' : 
                    severity === ErrorSeverity.MEDIUM ? 'warn' : 'info';
    
    console[logLevel](`[${errorType.toUpperCase()}] ${error.message}`, {
      exchange: exchange?.name,
      context,
      suggestions: suggestions.slice(0, 2) // نمایش 2 پیشنهاد اول
    });

    return errorInfo;
  }

  /**
   * مدیریت خطای صرافی
   */
  public handleExchangeError(error: Error, exchange: CexInfo): ErrorInfo {
    const errorInfo = this.logError(error, { exchange: exchange.id }, exchange);
    
    // اقدامات خاص برای انواع مختلف خطا
    switch (errorInfo.type) {
      case ErrorType.RATE_LIMIT_ERROR:
        console.warn(`Rate limit hit for ${exchange.name}. Implementing backoff...`);
        break;
      
      case ErrorType.CORS_ERROR:
        console.warn(`CORS error for ${exchange.name}. Consider using demo mode.`);
        break;
      
      case ErrorType.NETWORK_ERROR:
        console.warn(`Network error for ${exchange.name}. Will retry...`);
        break;
    }

    return errorInfo;
  }

  /**
   * مدیریت خطای محاسبات
   */
  public handleCalculationError(error: Error, context: any): ErrorInfo {
    return this.logError(error, { 
      calculationType: context.type,
      inputData: context.data,
      step: context.step 
    });
  }

  /**
   * بررسی قابلیت تکرار خطا
   */
  public isErrorRetryable(error: Error): boolean {
    const errorType = this.detectErrorType(error);
    return this.isRetryable(errorType);
  }

  /**
   * دریافت آمار خطاها
   */
  public getErrorStats(): ErrorStats {
    const stats: ErrorStats = {
      total: this.errors.length,
      byType: {},
      bySeverity: {},
      byExchange: {},
      recentErrors: this.errors.slice(-10) // 10 خطای اخیر
    };

    this.errors.forEach(error => {
      // آمار بر اساس نوع
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      
      // آمار بر اساس شدت
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      
      // آمار بر اساس صرافی
      if (error.exchange) {
        stats.byExchange[error.exchange.id] = (stats.byExchange[error.exchange.id] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * پاک کردن تاریخچه خطاها
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * دریافت خطاهای اخیر
   */
  public getRecentErrors(count: number = 10): ErrorInfo[] {
    return this.errors.slice(-count);
  }

  /**
   * دریافت خطاهای یک صرافی خاص
   */
  public getExchangeErrors(exchangeId: string): ErrorInfo[] {
    return this.errors.filter(error => error.exchange?.id === exchangeId);
  }

  /**
   * بررسی وجود خطاهای بحرانی
   */
  public hasCriticalErrors(): boolean {
    return this.errors.some(error => error.severity === ErrorSeverity.CRITICAL);
  }

  /**
   * دریافت پیشنهادات برای خطای خاص
   */
  public getErrorSuggestions(error: Error): string[] {
    const errorType = this.detectErrorType(error);
    return this.generateSuggestions(errorType);
  }
}

// نمونه سراسری مدیریت خطا
export const globalErrorHandler = new ErrorHandler();