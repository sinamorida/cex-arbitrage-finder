import { AnyOpportunity } from '../types';
import { globalNotificationSystem } from './notificationSystem';

/**
 * وضعیت بازار
 */
export enum MarketCondition {
  BULL = 'bull',           // صعودی
  BEAR = 'bear',           // نزولی
  SIDEWAYS = 'sideways',   // خنثی
  VOLATILE = 'volatile',   // پرنوسان
  STABLE = 'stable'        // پایدار
}

/**
 * سطح فعالیت بازار
 */
export enum MarketActivity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXTREME = 'extreme'
}

/**
 * تحلیل بازار
 */
export interface MarketAnalysis {
  condition: MarketCondition;
  activity: MarketActivity;
  volatility: number; // درصد
  opportunityCount: number;
  averageProfit: number;
  totalVolume: number;
  dominantStrategy: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
  trends: {
    profitTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    volumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    opportunityTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  };
}

/**
 * داده‌های تاریخی بازار
 */
interface MarketSnapshot {
  timestamp: number;
  opportunityCount: number;
  averageProfit: number;
  totalVolume: number;
  volatility: number;
  strategies: { [strategy: string]: number };
}

/**
 * هشدار بازار
 */
export interface MarketAlert {
  id: string;
  type: 'UNUSUAL_ACTIVITY' | 'HIGH_VOLATILITY' | 'FLASH_OPPORTUNITY_SURGE' | 'MARKET_SHIFT';
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: number;
  data?: any;
}

/**
 * کلاس تحلیل و نظارت بر بازار
 */
export class MarketAnalyzer {
  private history: MarketSnapshot[] = [];
  private maxHistorySize = 100; // نگهداری 100 snapshot
  private alerts: MarketAlert[] = [];
  private listeners: ((analysis: MarketAnalysis) => void)[] = [];

  /**
   * تحلیل فرصت‌های فعلی
   */
  public analyzeMarket(opportunities: AnyOpportunity[]): MarketAnalysis {
    const timestamp = Date.now();
    
    // محاسبه متریک‌های اساسی
    const opportunityCount = opportunities.length;
    const profits = opportunities.map(op => this.getOpportunityProfit(op));
    const averageProfit = profits.length > 0 ? profits.reduce((sum, p) => sum + p, 0) / profits.length : 0;
    
    // محاسبه حجم کل (شبیه‌سازی)
    const totalVolume = opportunities.reduce((sum, op) => {
      return sum + this.estimateOpportunityVolume(op);
    }, 0);

    // محاسبه نوسانات
    const volatility = this.calculateVolatility(profits);

    // تحلیل استراتژی‌ها
    const strategies = this.analyzeStrategies(opportunities);
    const dominantStrategy = this.findDominantStrategy(strategies);

    // تعیین وضعیت بازار
    const condition = this.determineMarketCondition(opportunities, volatility);
    const activity = this.determineMarketActivity(opportunityCount, averageProfit, volatility);
    const riskLevel = this.assessRiskLevel(volatility, condition, activity);

    // تحلیل روندها
    const trends = this.analyzeTrends();

    // ایجاد snapshot جدید
    const snapshot: MarketSnapshot = {
      timestamp,
      opportunityCount,
      averageProfit,
      totalVolume,
      volatility,
      strategies
    };

    this.addSnapshot(snapshot);

    // بررسی شرایط غیرعادی
    this.checkForUnusualActivity(snapshot);

    const analysis: MarketAnalysis = {
      condition,
      activity,
      volatility,
      opportunityCount,
      averageProfit,
      totalVolume,
      dominantStrategy,
      riskLevel,
      timestamp,
      trends
    };

    // اطلاع به listeners
    this.notifyListeners(analysis);

    return analysis;
  }

  /**
   * دریافت سود فرصت
   */
  private getOpportunityProfit(opportunity: AnyOpportunity): number {
    if (opportunity.type === 'statistical' || opportunity.type === 'pairs') {
      return opportunity.expectedReturn;
    }
    return opportunity.profitPercentage;
  }

  /**
   * تخمین حجم فرصت
   */
  private estimateOpportunityVolume(opportunity: AnyOpportunity): number {
    // شبیه‌سازی حجم بر اساس نوع استراتژی
    switch (opportunity.type) {
      case 'spatial':
      case 'flash':
        return 10000 + Math.random() * 50000;
      case 'triangular':
      case 'cross-triangular':
        return 5000 + Math.random() * 25000;
      case 'market-making':
        return opportunity.volume || 15000;
      case 'statistical':
      case 'pairs':
        return 8000 + Math.random() * 30000;
      default:
        return 10000;
    }
  }

  /**
   * محاسبه نوسانات
   */
  private calculateVolatility(profits: number[]): number {
    if (profits.length < 2) return 0;

    const mean = profits.reduce((sum, p) => sum + p, 0) / profits.length;
    const variance = profits.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / profits.length;
    return Math.sqrt(variance);
  }

  /**
   * تحلیل استراتژی‌ها
   */
  private analyzeStrategies(opportunities: AnyOpportunity[]): { [strategy: string]: number } {
    const strategies: { [strategy: string]: number } = {};
    
    opportunities.forEach(op => {
      strategies[op.type] = (strategies[op.type] || 0) + 1;
    });

    return strategies;
  }

  /**
   * پیدا کردن استراتژی غالب
   */
  private findDominantStrategy(strategies: { [strategy: string]: number }): string {
    let maxCount = 0;
    let dominantStrategy = 'none';

    Object.entries(strategies).forEach(([strategy, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantStrategy = strategy;
      }
    });

    return dominantStrategy;
  }

  /**
   * تعیین وضعیت بازار
   */
  private determineMarketCondition(opportunities: AnyOpportunity[], volatility: number): MarketCondition {
    const profits = opportunities.map(op => this.getOpportunityProfit(op));
    const averageProfit = profits.length > 0 ? profits.reduce((sum, p) => sum + p, 0) / profits.length : 0;

    // بررسی نوسانات بالا
    if (volatility > 2) {
      return MarketCondition.VOLATILE;
    }

    // بررسی پایداری
    if (volatility < 0.5 && opportunities.length > 0) {
      return MarketCondition.STABLE;
    }

    // بررسی روند بر اساس سود متوسط
    if (averageProfit > 1) {
      return MarketCondition.BULL;
    } else if (averageProfit < 0.3) {
      return MarketCondition.BEAR;
    }

    return MarketCondition.SIDEWAYS;
  }

  /**
   * تعیین سطح فعالیت بازار
   */
  private determineMarketActivity(opportunityCount: number, averageProfit: number, volatility: number): MarketActivity {
    const activityScore = (opportunityCount * 0.4) + (averageProfit * 20) + (volatility * 10);

    if (activityScore > 50) return MarketActivity.EXTREME;
    if (activityScore > 30) return MarketActivity.HIGH;
    if (activityScore > 15) return MarketActivity.MEDIUM;
    return MarketActivity.LOW;
  }

  /**
   * ارزیابی سطح ریسک
   */
  private assessRiskLevel(volatility: number, condition: MarketCondition, activity: MarketActivity): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;

    // نوسانات
    if (volatility > 2) riskScore += 3;
    else if (volatility > 1) riskScore += 2;
    else if (volatility > 0.5) riskScore += 1;

    // وضعیت بازار
    if (condition === MarketCondition.VOLATILE) riskScore += 2;
    else if (condition === MarketCondition.BEAR) riskScore += 1;

    // فعالیت بازار
    if (activity === MarketActivity.EXTREME) riskScore += 2;
    else if (activity === MarketActivity.HIGH) riskScore += 1;

    if (riskScore >= 5) return 'HIGH';
    if (riskScore >= 3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * تحلیل روندها
   */
  private analyzeTrends(): MarketAnalysis['trends'] {
    if (this.history.length < 3) {
      return {
        profitTrend: 'STABLE',
        volumeTrend: 'STABLE',
        opportunityTrend: 'STABLE'
      };
    }

    const recent = this.history.slice(-3);
    
    // تحلیل روند سود
    const profitTrend = this.calculateTrend(recent.map(s => s.averageProfit));
    const volumeTrend = this.calculateTrend(recent.map(s => s.totalVolume));
    const opportunityTrend = this.calculateTrend(recent.map(s => s.opportunityCount));

    return {
      profitTrend,
      volumeTrend,
      opportunityTrend
    };
  }

  /**
   * محاسبه روند
   */
  private calculateTrend(values: number[]): 'INCREASING' | 'DECREASING' | 'STABLE' {
    if (values.length < 2) return 'STABLE';

    const first = values[0];
    const last = values[values.length - 1];
    const change = (last - first) / first;

    if (change > 0.1) return 'INCREASING';
    if (change < -0.1) return 'DECREASING';
    return 'STABLE';
  }

  /**
   * اضافه کردن snapshot
   */
  private addSnapshot(snapshot: MarketSnapshot): void {
    this.history.push(snapshot);
    
    // محدود کردن اندازه تاریخچه
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * بررسی فعالیت غیرعادی
   */
  private checkForUnusualActivity(snapshot: MarketSnapshot): void {
    if (this.history.length < 5) return;

    const recent = this.history.slice(-5);
    const avgOpportunityCount = recent.reduce((sum, s) => sum + s.opportunityCount, 0) / recent.length;
    const avgProfit = recent.reduce((sum, s) => sum + s.averageProfit, 0) / recent.length;

    // بررسی افزایش ناگهانی فرصت‌ها
    if (snapshot.opportunityCount > avgOpportunityCount * 2) {
      this.createAlert(
        'UNUSUAL_ACTIVITY',
        `افزایش ناگهانی فرصت‌ها: ${snapshot.opportunityCount} (میانگین: ${avgOpportunityCount.toFixed(0)})`,
        'WARNING',
        { current: snapshot.opportunityCount, average: avgOpportunityCount }
      );
    }

    // بررسی افزایش ناگهانی سود
    if (snapshot.averageProfit > avgProfit * 1.5) {
      this.createAlert(
        'HIGH_VOLATILITY',
        `افزایش ناگهانی سود متوسط: ${snapshot.averageProfit.toFixed(2)}% (میانگین: ${avgProfit.toFixed(2)}%)`,
        'INFO',
        { current: snapshot.averageProfit, average: avgProfit }
      );
    }

    // بررسی فرصت‌های flash زیاد
    const flashCount = Object.entries(snapshot.strategies).find(([strategy]) => strategy === 'flash')?.[1] || 0;
    if (flashCount > 5) {
      this.createAlert(
        'FLASH_OPPORTUNITY_SURGE',
        `افزایش فرصت‌های فوری: ${flashCount} فرصت flash شناسایی شد`,
        'CRITICAL',
        { flashCount }
      );
    }
  }

  /**
   * ایجاد هشدار
   */
  private createAlert(
    type: MarketAlert['type'],
    message: string,
    severity: MarketAlert['severity'],
    data?: any
  ): void {
    const alert: MarketAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      severity,
      timestamp: Date.now(),
      data
    };

    this.alerts.unshift(alert);

    // محدود کردن تعداد هشدارها
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }

    // ارسال اعلان
    if (severity === 'CRITICAL' || severity === 'WARNING') {
      globalNotificationSystem.notifyMarketChange(message);
    }

    console.log(`🚨 Market Alert [${severity}]: ${message}`);
  }

  /**
   * دریافت هشدارهای اخیر
   */
  public getRecentAlerts(count: number = 10): MarketAlert[] {
    return this.alerts.slice(0, count);
  }

  /**
   * دریافت تاریخچه بازار
   */
  public getMarketHistory(hours: number = 1): MarketSnapshot[] {
    const cutoff = Date.now() - (hours * 3600000);
    return this.history.filter(snapshot => snapshot.timestamp >= cutoff);
  }

  /**
   * اضافه کردن listener
   */
  public addListener(callback: (analysis: MarketAnalysis) => void): void {
    this.listeners.push(callback);
  }

  /**
   * حذف listener
   */
  public removeListener(callback: (analysis: MarketAnalysis) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * اطلاع به listeners
   */
  private notifyListeners(analysis: MarketAnalysis): void {
    this.listeners.forEach(callback => {
      try {
        callback(analysis);
      } catch (error) {
        console.error('Error in market analysis listener:', error);
      }
    });
  }

  /**
   * پاک کردن تاریخچه
   */
  public clearHistory(): void {
    this.history = [];
    this.alerts = [];
  }
}

// نمونه سراسری تحلیلگر بازار
export const globalMarketAnalyzer = new MarketAnalyzer();