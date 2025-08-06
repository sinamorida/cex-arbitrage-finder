import React, { useState, useEffect, useCallback } from 'react';
import { AnyOpportunity, DataStatus } from './types';
import { findArbitrageOpportunities, setUseRealData } from './services/browserExchangeService';
import Header from './components/Header';
import OpportunityList from './components/OpportunityList';
import StatusIndicator from './components/StatusIndicator';
import StrategyStats from './components/StrategyStats';
import ErrorBoundary from './components/ErrorBoundary';
import SystemHealthDashboard from './components/SystemHealthDashboard';
import { REFRESH_INTERVAL_MS, SUPPORTED_CEXS, PAIRS_TO_SCAN } from './constants';
import { globalErrorHandler } from './utils/errorHandler';
import { globalNotificationSystem } from './utils/notificationSystem';
import { globalOpportunityLifecycle } from './utils/opportunityLifecycle';
import { globalMarketAnalyzer } from './utils/marketAnalysis';

const App: React.FC = () => {
  const [opportunities, setOpportunities] = useState<AnyOpportunity[]>([]);
  const [status, setStatus] = useState<DataStatus>(DataStatus.IDLE);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUsingRealData, setIsUsingRealData] = useState(false);

  const handleToggleRealData = useCallback((useRealData: boolean) => {
    setIsUsingRealData(useRealData);
    setUseRealData(useRealData);
    // Trigger immediate reload with new data source
    loadOpportunities();
  }, []);

  const loadOpportunities = useCallback(async () => {
    setStatus(DataStatus.LOADING);
    setErrorMessage(null);
    try {
      const newOpportunities = await findArbitrageOpportunities();
      
      // بررسی فرصت‌های جدید و ایجاد اعلان
      globalNotificationSystem.checkOpportunities(newOpportunities);
      
      // به‌روزرسانی چرخه حیات فرصت‌ها
      globalOpportunityLifecycle.updateOpportunities(newOpportunities);
      
      // تحلیل شرایط بازار
      globalMarketAnalyzer.analyzeMarket(newOpportunities);
      
      setOpportunities(newOpportunities);
      setStatus(DataStatus.SUCCESS);
      setLastUpdated(Date.now());
      
      // Clear any previous errors on successful load
      if (globalErrorHandler.hasCriticalErrors()) {
        console.log('✅ System recovered from previous errors');
        globalNotificationSystem.notifyMarketChange('سیستم از خطاهای قبلی بازیابی شد');
      }
    } catch (error: any) {
      const errorInfo = globalErrorHandler.logError(error, { 
        context: 'fetchAllOpportunities',
        isInitialLoad,
        timestamp: Date.now()
      });
      
      // ایجاد اعلان خطای سیستم
      globalNotificationSystem.notifySystemError(error, { context: 'fetchAllOpportunities' });
      
      console.error("Failed to fetch arbitrage opportunities:", error);
      setStatus(DataStatus.ERROR);
      
      // Create user-friendly error message with suggestions
      const suggestions = errorInfo.suggestions.slice(0, 2).join(' یا ');
      const userMessage = `خطا در دریافت داده‌های بازار: ${error.message}. ${suggestions ? `پیشنهاد: ${suggestions}` : ''}`;
      setErrorMessage(userMessage);
    } finally {
        if (isInitialLoad) setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: number;

    const runLoadCycle = async () => {
      if (!isMounted) return;
      await loadOpportunities();
      if (isMounted) {
        timeoutId = window.setTimeout(runLoadCycle, REFRESH_INTERVAL_MS);
      }
    };

    runLoadCycle();

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadOpportunities]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
        <Header 
          onToggleRealData={handleToggleRealData}
          isUsingRealData={isUsingRealData}
        />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-semibold text-sky-400">فرصت‌های آربیتراژ</h2>
            <StatusIndicator status={status} lastUpdated={lastUpdated} />
          </div>

          {isInitialLoad && status === DataStatus.LOADING && (
            <div className="text-center py-10">
              <p className="text-xl text-gray-400">در حال اسکن فرصت‌ها...</p>
              <p className="text-sm text-gray-500 mt-2">
                  بررسی {PAIRS_TO_SCAN.length} جفت ارز در {SUPPORTED_CEXS.length} صرافی برای آربیتراژ فضایی و مثلثی.
              </p>
              <div className="mt-4 animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto"></div>
            </div>
          )}
          
          {status === DataStatus.ERROR && (
            <div className="text-center py-10 bg-red-900/20 p-6 rounded-lg">
              <p className="text-xl text-red-400">خطا در بارگذاری داده‌های بازار</p>
              <p className="text-gray-400 mt-1">{errorMessage || "امکان دریافت داده وجود ندارد. این ممکن است به دلیل محدودیت API، مشکلات شبکه یا مسائل CORS باشد."}</p>
            </div>
          )}
          
          <ErrorBoundary>
            {!isInitialLoad && status !== DataStatus.ERROR && opportunities.length > 0 && (
              <>
                <StrategyStats opportunities={opportunities} />
                <OpportunityList opportunities={opportunities} />
              </>
            )}
          </ErrorBoundary>
          
          {!isInitialLoad && status === DataStatus.SUCCESS && opportunities.length === 0 && (
             <div className="text-center py-10 bg-gray-800 p-6 rounded-lg">
              <p className="text-xl text-gray-400">فرصت آربیتراژ قابل توجهی یافت نشد.</p>
              <p className="text-sm text-gray-500 mt-1">بازارها در حال حاضر کارآمد هستند. ادامه اسکن برای فرصت‌های جدید.</p>
            </div>
          )}
        </main>
        
        {/* System Health Dashboard */}
        <SystemHealthDashboard />
        
        <footer className="text-center py-4 border-t border-gray-700 text-sm text-gray-500">
          <p>CEX Arbitrage Finder &copy; {new Date().getFullYear()}. داده‌ها از API های عمومی صرافی‌ها از طریق CCXT.</p>
          <p className="text-xs text-gray-600 mt-1">این ابزار برای اهداف آموزشی است. مشاوره مالی نیست. محاسبات سود شامل کارمزد معاملات، انتقال یا شبکه نمی‌شود.</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
