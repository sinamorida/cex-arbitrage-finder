import { AnyOpportunity } from '../types';

/**
 * وضعیت فرصت
 */
export enum OpportunityStatus {
  NEW = 'new',
  ACTIVE = 'active',
  UPDATED = 'updated',
  EXPIRED = 'expired',
  EXECUTED = 'executed'
}

/**
 * اطلاعات چرخه حیات فرصت
 */
export interface OpportunityLifecycle {
  id: string;
  opportunity: AnyOpportunity;
  status: OpportunityStatus;
  createdAt: number;
  lastUpdated: number;
  expiresAt: number;
  updateCount: number;
  profitHistory: number[];
  isHighlighted: boolean;
  executionAttempts: number;
}

/**
 * تنظیمات چرخه حیات
 */
export interface LifecycleSettings {
  defaultTTL: number; // زمان انقضا پیش‌فرض (میلی‌ثانیه)
  maxUpdateCount: number; // حداکثر تعداد به‌روزرسانی
  profitChangeThreshold: number; // حد آستانه تغییر سود برای به‌روزرسانی
  highlightDuration: number; // مدت زمان هایلایت (میلی‌ثانیه)
  cleanupInterval: number; // فاصله پاک‌سازی (میلی‌ثانیه)
}

/**
 * آمار چرخه حیات
 */
export interface LifecycleStats {
  totalOpportunities: number;
  activeOpportunities: number;
  expiredOpportunities: number;
  averageLifetime: number;
  mostUpdatedOpportunity: string;
  highestProfitOpportunity: string;
}

/**
 * کلاس مدیریت چرخه حیات فرصت‌ها
 */
export class OpportunityLifecycleManager {
  private opportunities: Map<string, OpportunityLifecycle> = new Map();
  private settings: LifecycleSettings;
  private listeners: ((opportunities: OpportunityLifecycle[]) => void)[] = [];
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = {
      defaultTTL: 300000, // 5 دقیقه
      maxUpdateCount: 10,
      profitChangeThreshold: 0.1, // 0.1%
      highlightDuration: 10000, // 10 ثانیه
      cleanupInterval: 30000 // 30 ثانیه
    };

    this.startCleanupTimer();
  }

  /**
   * شروع تایمر پاک‌سازی
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredOpportunities();
    }, this.settings.cleanupInterval);
  }

  /**
   * پاک‌سازی فرصت‌های منقضی شده
   */
  private cleanupExpiredOpportunities(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    this.opportunities.forEach((lifecycle, id) => {
      if (now > lifecycle.expiresAt) {
        lifecycle.status = OpportunityStatus.EXPIRED;
        expiredIds.push(id);
      }
    });

    // حذف فرصت‌های منقضی شده پس از 1 ساعت
    expiredIds.forEach(id => {
      const lifecycle = this.opportunities.get(id);
      if (lifecycle && now - lifecycle.expiresAt > 3600000) { // 1 ساعت
        this.opportunities.delete(id);
      }
    });

    if (expiredIds.length > 0) {
      console.log(`🗑️ Cleaned up ${expiredIds.length} expired opportunities`);
      this.notifyListeners();
    }
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
   * محاسبه زمان انقضا بر اساس نوع فرصت
   */
  private calculateTTL(opportunity: AnyOpportunity): number {
    switch (opportunity.type) {
      case 'flash':
        return opportunity.timeWindow * 1000; // تبدیل ثانیه به میلی‌ثانیه
      case 'market-making':
        return 600000; // 10 دقیقه
      case 'statistical':
      case 'pairs':
        return 1800000; // 30 دقیقه
      default:
        return this.settings.defaultTTL;
    }
  }

  /**
   * اضافه کردن یا به‌روزرسانی فرصت
   */
  public addOrUpdateOpportunity(opportunity: AnyOpportunity): OpportunityStatus {
    const now = Date.now();
    const existingLifecycle = this.opportunities.get(opportunity.id);

    if (existingLifecycle) {
      // به‌روزرسانی فرصت موجود
      const currentProfit = this.getOpportunityProfit(opportunity);
      const previousProfit = this.getOpportunityProfit(existingLifecycle.opportunity);
      const profitChange = Math.abs(currentProfit - previousProfit);

      // بررسی آیا تغییر قابل توجهی رخ داده
      if (profitChange >= this.settings.profitChangeThreshold) {
        existingLifecycle.opportunity = opportunity;
        existingLifecycle.status = OpportunityStatus.UPDATED;
        existingLifecycle.lastUpdated = now;
        existingLifecycle.updateCount++;
        existingLifecycle.profitHistory.push(currentProfit);
        existingLifecycle.isHighlighted = true;
        existingLifecycle.expiresAt = now + this.calculateTTL(opportunity);

        // حذف هایلایت پس از مدت زمان مشخص
        setTimeout(() => {
          if (this.opportunities.has(opportunity.id)) {
            this.opportunities.get(opportunity.id)!.isHighlighted = false;
            this.notifyListeners();
          }
        }, this.settings.highlightDuration);

        console.log(`📈 Updated opportunity ${opportunity.id} - Profit change: ${profitChange.toFixed(3)}%`);
        this.notifyListeners();
        return OpportunityStatus.UPDATED;
      }

      // به‌روزرسانی زمان انقضا حتی اگر سود تغییر نکرده
      existingLifecycle.lastUpdated = now;
      existingLifecycle.expiresAt = now + this.calculateTTL(opportunity);
      return OpportunityStatus.ACTIVE;
    } else {
      // اضافه کردن فرصت جدید
      const ttl = this.calculateTTL(opportunity);
      const lifecycle: OpportunityLifecycle = {
        id: opportunity.id,
        opportunity,
        status: OpportunityStatus.NEW,
        createdAt: now,
        lastUpdated: now,
        expiresAt: now + ttl,
        updateCount: 0,
        profitHistory: [this.getOpportunityProfit(opportunity)],
        isHighlighted: true,
        executionAttempts: 0
      };

      this.opportunities.set(opportunity.id, lifecycle);

      // حذف هایلایت پس از مدت زمان مشخص
      setTimeout(() => {
        if (this.opportunities.has(opportunity.id)) {
          const opp = this.opportunities.get(opportunity.id)!;
          opp.isHighlighted = false;
          opp.status = OpportunityStatus.ACTIVE;
          this.notifyListeners();
        }
      }, this.settings.highlightDuration);

      console.log(`✨ New opportunity ${opportunity.id} - TTL: ${ttl / 1000}s`);
      this.notifyListeners();
      return OpportunityStatus.NEW;
    }
  }

  /**
   * به‌روزرسانی دسته‌ای فرصت‌ها
   */
  public updateOpportunities(opportunities: AnyOpportunity[]): void {
    const currentIds = new Set(opportunities.map(op => op.id));
    const now = Date.now();

    // علامت‌گذاری فرصت‌هایی که دیگر وجود ندارند به عنوان منقضی
    this.opportunities.forEach((lifecycle, id) => {
      if (!currentIds.has(id) && lifecycle.status !== OpportunityStatus.EXPIRED) {
        lifecycle.status = OpportunityStatus.EXPIRED;
        lifecycle.expiresAt = now;
      }
    });

    // اضافه یا به‌روزرسانی فرصت‌های جدید
    opportunities.forEach(opportunity => {
      this.addOrUpdateOpportunity(opportunity);
    });
  }

  /**
   * علامت‌گذاری فرصت به عنوان اجرا شده
   */
  public markAsExecuted(opportunityId: string): boolean {
    const lifecycle = this.opportunities.get(opportunityId);
    if (lifecycle) {
      lifecycle.status = OpportunityStatus.EXECUTED;
      lifecycle.executionAttempts++;
      lifecycle.lastUpdated = Date.now();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * دریافت فرصت‌های فعال
   */
  public getActiveOpportunities(): OpportunityLifecycle[] {
    const now = Date.now();
    return Array.from(this.opportunities.values())
      .filter(lifecycle => 
        lifecycle.status !== OpportunityStatus.EXPIRED && 
        now <= lifecycle.expiresAt
      )
      .sort((a, b) => {
        // اولویت‌بندی: جدید > به‌روزرسانی شده > فعال
        if (a.status === OpportunityStatus.NEW && b.status !== OpportunityStatus.NEW) return -1;
        if (b.status === OpportunityStatus.NEW && a.status !== OpportunityStatus.NEW) return 1;
        if (a.status === OpportunityStatus.UPDATED && b.status === OpportunityStatus.ACTIVE) return -1;
        if (b.status === OpportunityStatus.UPDATED && a.status === OpportunityStatus.ACTIVE) return 1;
        
        // سپس بر اساس سود
        const aProfit = this.getOpportunityProfit(a.opportunity);
        const bProfit = this.getOpportunityProfit(b.opportunity);
        return bProfit - aProfit;
      });
  }

  /**
   * دریافت فرصت‌های منقضی شده
   */
  public getExpiredOpportunities(): OpportunityLifecycle[] {
    return Array.from(this.opportunities.values())
      .filter(lifecycle => lifecycle.status === OpportunityStatus.EXPIRED)
      .sort((a, b) => b.expiresAt - a.expiresAt);
  }

  /**
   * دریافت فرصت‌های هایلایت شده
   */
  public getHighlightedOpportunities(): OpportunityLifecycle[] {
    return Array.from(this.opportunities.values())
      .filter(lifecycle => lifecycle.isHighlighted);
  }

  /**
   * دریافت آمار چرخه حیات
   */
  public getStats(): LifecycleStats {
    const opportunities = Array.from(this.opportunities.values());
    const now = Date.now();
    
    const activeOpportunities = opportunities.filter(op => 
      op.status !== OpportunityStatus.EXPIRED && now <= op.expiresAt
    );
    
    const expiredOpportunities = opportunities.filter(op => 
      op.status === OpportunityStatus.EXPIRED || now > op.expiresAt
    );

    // محاسبه میانگین طول عمر
    const lifetimes = expiredOpportunities.map(op => op.expiresAt - op.createdAt);
    const averageLifetime = lifetimes.length > 0 
      ? lifetimes.reduce((sum, lifetime) => sum + lifetime, 0) / lifetimes.length 
      : 0;

    // پیدا کردن فرصت با بیشترین به‌روزرسانی
    const mostUpdated = opportunities.reduce((max, current) => 
      current.updateCount > max.updateCount ? current : max, 
      opportunities[0]
    );

    // پیدا کردن فرصت با بیشترین سود
    const highestProfit = opportunities.reduce((max, current) => {
      const currentProfit = this.getOpportunityProfit(current.opportunity);
      const maxProfit = this.getOpportunityProfit(max.opportunity);
      return currentProfit > maxProfit ? current : max;
    }, opportunities[0]);

    return {
      totalOpportunities: opportunities.length,
      activeOpportunities: activeOpportunities.length,
      expiredOpportunities: expiredOpportunities.length,
      averageLifetime,
      mostUpdatedOpportunity: mostUpdated?.id || '',
      highestProfitOpportunity: highestProfit?.id || ''
    };
  }

  /**
   * دریافت تاریخچه سود فرصت
   */
  public getProfitHistory(opportunityId: string): number[] {
    const lifecycle = this.opportunities.get(opportunityId);
    return lifecycle ? [...lifecycle.profitHistory] : [];
  }

  /**
   * پاک کردن همه فرصت‌ها
   */
  public clearAll(): void {
    this.opportunities.clear();
    this.notifyListeners();
  }

  /**
   * اضافه کردن listener
   */
  public addListener(callback: (opportunities: OpportunityLifecycle[]) => void): void {
    this.listeners.push(callback);
  }

  /**
   * حذف listener
   */
  public removeListener(callback: (opportunities: OpportunityLifecycle[]) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * اطلاع به listeners
   */
  private notifyListeners(): void {
    const activeOpportunities = this.getActiveOpportunities();
    this.listeners.forEach(callback => {
      try {
        callback(activeOpportunities);
      } catch (error) {
        console.error('Error in lifecycle listener:', error);
      }
    });
  }

  /**
   * به‌روزرسانی تنظیمات
   */
  public updateSettings(newSettings: Partial<LifecycleSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * دریافت تنظیمات
   */
  public getSettings(): LifecycleSettings {
    return { ...this.settings };
  }

  /**
   * تمیز کردن منابع
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.opportunities.clear();
    this.listeners = [];
  }
}

// نمونه سراسری مدیریت چرخه حیات
export const globalOpportunityLifecycle = new OpportunityLifecycleManager();