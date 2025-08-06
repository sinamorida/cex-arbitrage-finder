import React, { useState, useEffect } from 'react';
import { globalErrorHandler } from '../utils/errorHandler';
import { globalRetryHandler, CircuitState } from '../utils/retryHandler';
import { globalNotificationSystem } from '../utils/notificationSystem';
import { SUPPORTED_CEXS } from '../constants';

interface SystemMetrics {
  uptime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

interface ExchangeHealth {
  id: string;
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  circuitState: CircuitState;
  lastError?: string;
  responseTime: number;
  successRate: number;
}

const SystemHealthDashboard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  });
  const [exchangeHealth, setExchangeHealth] = useState<ExchangeHealth[]>([]);

  useEffect(() => {
    const updateMetrics = () => {
      // محاسبه uptime
      const uptime = Date.now() - (window as any).appStartTime || Date.now();
      
      // دریافت آمار خطاها
      const errorStats = globalErrorHandler.getErrorStats();
      
      // دریافت وضعیت circuit breaker ها
      const circuitStates = globalRetryHandler.getCircuitStates();
      
      // به‌روزرسانی متریک‌های سیستم
      setMetrics({
        uptime,
        totalRequests: errorStats.total + 100, // شبیه‌سازی
        successfulRequests: 100 - errorStats.total,
        failedRequests: errorStats.total,
        averageResponseTime: 250 + Math.random() * 100, // شبیه‌سازی
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        cacheHitRate: 85 + Math.random() * 10 // شبیه‌سازی
      });

      // به‌روزرسانی وضعیت صرافی‌ها
      const healthData: ExchangeHealth[] = SUPPORTED_CEXS.map(exchange => {
        const exchangeErrors = globalErrorHandler.getExchangeErrors(exchange.id);
        const circuitState = circuitStates[exchange.id] || CircuitState.CLOSED;
        const recentErrors = exchangeErrors.slice(-5);
        
        let status: 'HEALTHY' | 'DEGRADED' | 'DOWN' = 'HEALTHY';
        if (circuitState === CircuitState.OPEN) {
          status = 'DOWN';
        } else if (recentErrors.length > 2) {
          status = 'DEGRADED';
        }

        return {
          id: exchange.id,
          name: exchange.name,
          status,
          circuitState,
          lastError: recentErrors[0]?.message,
          responseTime: 200 + Math.random() * 300, // شبیه‌سازی
          successRate: Math.max(0, 100 - (recentErrors.length * 10))
        };
      });

      setExchangeHealth(healthData);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // به‌روزرسانی هر 5 ثانیه

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'HEALTHY': return 'text-green-400';
      case 'DEGRADED': return 'text-yellow-400';
      case 'DOWN': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCircuitStateColor = (state: CircuitState): string => {
    switch (state) {
      case CircuitState.CLOSED: return 'text-green-400';
      case CircuitState.HALF_OPEN: return 'text-yellow-400';
      case CircuitState.OPEN: return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getOverallSystemHealth = (): { status: string; color: string } => {
    const downCount = exchangeHealth.filter(ex => ex.status === 'DOWN').length;
    const degradedCount = exchangeHealth.filter(ex => ex.status === 'DEGRADED').length;
    
    if (downCount > 2) return { status: 'CRITICAL', color: 'text-red-400' };
    if (downCount > 0 || degradedCount > 2) return { status: 'DEGRADED', color: 'text-yellow-400' };
    return { status: 'HEALTHY', color: 'text-green-400' };
  };

  const systemHealth = getOverallSystemHealth();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-colors z-40"
        title="وضعیت سیستم"
      >
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${systemHealth.status === 'HEALTHY' ? 'bg-green-400' : systemHealth.status === 'DEGRADED' ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`}></div>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${systemHealth.status === 'HEALTHY' ? 'bg-green-400' : systemHealth.status === 'DEGRADED' ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`}></div>
          <h3 className="text-lg font-semibold text-white">وضعیت سیستم</h3>
          <span className={`text-sm font-medium ${systemHealth.color}`}>
            {systemHealth.status === 'HEALTHY' ? 'سالم' : systemHealth.status === 'DEGRADED' ? 'کاهش عملکرد' : 'بحرانی'}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* System Metrics */}
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-3">متریک‌های سیستم</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-700/50 rounded p-2">
            <div className="text-gray-400">زمان فعالیت</div>
            <div className="text-white font-medium">{formatUptime(metrics.uptime)}</div>
          </div>
          <div className="bg-gray-700/50 rounded p-2">
            <div className="text-gray-400">نرخ موفقیت</div>
            <div className="text-green-400 font-medium">
              {metrics.totalRequests > 0 ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1) : 100}%
            </div>
          </div>
          <div className="bg-gray-700/50 rounded p-2">
            <div className="text-gray-400">زمان پاسخ</div>
            <div className="text-blue-400 font-medium">{metrics.averageResponseTime.toFixed(0)}ms</div>
          </div>
          <div className="bg-gray-700/50 rounded p-2">
            <div className="text-gray-400">حافظه</div>
            <div className="text-purple-400 font-medium">{formatBytes(metrics.memoryUsage)}</div>
          </div>
        </div>
      </div>

      {/* Exchange Health */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">وضعیت صرافی‌ها</h4>
        <div className="space-y-2">
          {exchangeHealth.map(exchange => (
            <div key={exchange.id} className="bg-gray-700/50 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${exchange.status === 'HEALTHY' ? 'bg-green-400' : exchange.status === 'DEGRADED' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                  <span className="text-sm font-medium text-white">{exchange.name}</span>
                </div>
                <span className={`text-xs ${getStatusColor(exchange.status)}`}>
                  {exchange.status === 'HEALTHY' ? 'سالم' : exchange.status === 'DEGRADED' ? 'کاهش عملکرد' : 'قطع'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Circuit: </span>
                  <span className={getCircuitStateColor(exchange.circuitState)}>
                    {exchange.circuitState === CircuitState.CLOSED ? 'بسته' : 
                     exchange.circuitState === CircuitState.HALF_OPEN ? 'نیمه‌باز' : 'باز'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">موفقیت: </span>
                  <span className="text-white">{exchange.successRate.toFixed(0)}%</span>
                </div>
              </div>
              
              {exchange.lastError && (
                <div className="mt-2 text-xs text-red-400 truncate">
                  آخرین خطا: {exchange.lastError}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <button
            onClick={() => globalRetryHandler.resetAllCircuitBreakers()}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
          >
            ریست Circuit Breakers
          </button>
          <button
            onClick={() => globalErrorHandler.clearErrors()}
            className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
          >
            پاک کردن خطاها
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthDashboard;