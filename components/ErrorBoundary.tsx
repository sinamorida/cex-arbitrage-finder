import React, { Component, ErrorInfo, ReactNode } from 'react';
import { globalErrorHandler, ErrorSeverity } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * کامپوننت Error Boundary برای جلوگیری از کرش اپلیکیشن
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ثبت خطا در سیستم مدیریت خطا
    globalErrorHandler.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    this.setState({
      error,
      errorInfo
    });

    // فراخوانی callback اختیاری
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // نمایش fallback اختیاری
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // نمایش صفحه خطای پیش‌فرض
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-6 text-center">
            <div className="mb-4">
              <svg 
                className="w-16 h-16 text-red-500 mx-auto mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
              <h2 className="text-xl font-bold text-red-400 mb-2">
                خطای غیرمنتظره
              </h2>
              <p className="text-gray-300 text-sm mb-4">
                متأسفانه خطایی در اپلیکیشن رخ داده است. لطفاً دوباره تلاش کنید.
              </p>
            </div>

            {/* نمایش جزئیات خطا در حالت توسعه */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-gray-700 rounded text-left text-xs">
                <div className="text-red-400 font-mono mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre className="text-gray-400 whitespace-pre-wrap text-xs overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* دکمه‌های عملیات */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                تلاش مجدد
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                بارگذاری مجدد
              </button>
            </div>

            {/* پیشنهادات حل مشکل */}
            {this.state.error && (
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-right">
                <h4 className="text-yellow-400 font-medium mb-2 text-sm">
                  راه‌حل‌های پیشنهادی:
                </h4>
                <ul className="text-yellow-300 text-xs space-y-1">
                  {globalErrorHandler.getErrorSuggestions(this.state.error).slice(0, 3).map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* اطلاعات تماس */}
            <div className="mt-4 text-xs text-gray-500">
              اگر مشکل ادامه دارد، لطفاً با پشتیبانی تماس بگیرید.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;