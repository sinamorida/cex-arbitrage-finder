import { AnyOpportunity } from '../types';

/**
 * نوع اعلان
 */
export enum NotificationType {
  HIGH_PROFIT = 'high_profit',
  NEW_OPPORTUNITY = 'new_opportunity',
  FLASH_OPPORTUNITY = 'flash_opportunity',
  SYSTEM_ERROR = 'system_error',
  MARKET_CHANGE = 'market_change'
}

/**
 * سطح اولویت اعلان
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * ساختار اعلان
 */
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: number;
  opportunity?: AnyOpportunity;
  isRead: boolean;
  isAudioEnabled: boolean;
  autoHide: boolean;
  hideAfter?: number; // میلی‌ثانیه
}

/**
 * تنظیمات اعلان‌ها
 */
export interface NotificationSettings {
  enabled: boolean;
  audioEnabled: boolean;
  desktopEnabled: boolean;
  minProfitThreshold: number;
  enabledTypes: NotificationType[];
  priorityFilter: NotificationPriority[];
  autoHideDelay: number;
  maxNotifications: number;
}

/**
 * کلاس مدیریت سیستم اعلان‌ها
 */
export class NotificationSystem {
  private notifications: Notification[] = [];
  private settings: NotificationSettings;
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private audioContext: AudioContext | null = null;
  private lastOpportunityIds: Set<string> = new Set();

  constructor() {
    this.settings = this.loadSettings();
    this.initializeAudio();
    this.requestNotificationPermission();
  }

  /**
   * بارگذاری تنظیمات از localStorage
   */
  private loadSettings(): NotificationSettings {
    const saved = localStorage.getItem('notification-settings');
    if (saved) {
      try {
        return { ...this.getDefaultSettings(), ...JSON.parse(saved) };
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
    return this.getDefaultSettings();
  }

  /**
   * تنظیمات پیش‌فرض
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      audioEnabled: true,
      desktopEnabled: true,
      minProfitThreshold: 0.5, // 0.5%
      enabledTypes: [
        NotificationType.HIGH_PROFIT,
        NotificationType.FLASH_OPPORTUNITY,
        NotificationType.SYSTEM_ERROR
      ],
      priorityFilter: [NotificationPriority.MEDIUM, NotificationPriority.HIGH, NotificationPriority.CRITICAL],
      autoHideDelay: 5000, // 5 ثانیه
      maxNotifications: 10
    };
  }

  /**
   * ذخیره تنظیمات
   */
  private saveSettings(): void {
    localStorage.setItem('notification-settings', JSON.stringify(this.settings));
  }

  /**
   * راه‌اندازی سیستم صوتی
   */
  private initializeAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  /**
   * درخواست مجوز اعلان‌های دسکتاپ
   */
  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('Notification permission request failed:', error);
      }
    }
  }

  /**
   * تولید صدای اعلان
   */
  private playNotificationSound(priority: NotificationPriority): void {
    if (!this.settings.audioEnabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // تنظیم فرکانس بر اساس اولویت
      switch (priority) {
        case NotificationPriority.CRITICAL:
          oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
          break;
        case NotificationPriority.HIGH:
          oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
          break;
        case NotificationPriority.MEDIUM:
          oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
          break;
        default:
          oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      }

      oscillator.type = 'sine';
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  /**
   * نمایش اعلان دسکتاپ
   */
  private showDesktopNotification(notification: Notification): void {
    if (!this.settings.desktopEnabled || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === NotificationPriority.CRITICAL
      });

      // بستن خودکار
      if (notification.autoHide && notification.hideAfter) {
        setTimeout(() => {
          desktopNotification.close();
        }, notification.hideAfter);
      }

      // کلیک روی اعلان
      desktopNotification.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        desktopNotification.close();
      };
    } catch (error) {
      console.warn('Failed to show desktop notification:', error);
    }
  }

  /**
   * ایجاد اعلان جدید
   */
  public createNotification(
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    opportunity?: AnyOpportunity
  ): string {
    if (!this.settings.enabled || !this.settings.enabledTypes.includes(type)) {
      return '';
    }

    if (!this.settings.priorityFilter.includes(priority)) {
      return '';
    }

    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      title,
      message,
      timestamp: Date.now(),
      opportunity,
      isRead: false,
      isAudioEnabled: this.settings.audioEnabled,
      autoHide: priority !== NotificationPriority.CRITICAL,
      hideAfter: this.settings.autoHideDelay
    };

    // اضافه کردن به لیست
    this.notifications.unshift(notification);

    // محدود کردن تعداد اعلان‌ها
    if (this.notifications.length > this.settings.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.settings.maxNotifications);
    }

    // پخش صدا
    this.playNotificationSound(priority);

    // نمایش اعلان دسکتاپ
    this.showDesktopNotification(notification);

    // اطلاع به listeners
    this.notifyListeners();

    return notification.id;
  }

  /**
   * بررسی فرصت‌های جدید و ایجاد اعلان
   */
  public checkOpportunities(opportunities: AnyOpportunity[]): void {
    const currentIds = new Set(opportunities.map(op => op.id));
    
    opportunities.forEach(opportunity => {
      // فرصت جدید
      if (!this.lastOpportunityIds.has(opportunity.id)) {
        this.handleNewOpportunity(opportunity);
      }
    });

    this.lastOpportunityIds = currentIds;
  }

  /**
   * مدیریت فرصت جدید
   */
  private handleNewOpportunity(opportunity: AnyOpportunity): void {
    const profit = this.getOpportunityProfit(opportunity);
    
    // فرصت سود بالا
    if (profit >= this.settings.minProfitThreshold * 2) {
      this.createNotification(
        NotificationType.HIGH_PROFIT,
        `فرصت سود بالا! ${profit.toFixed(2)}%`,
        `${opportunity.pair} - ${this.getStrategyName(opportunity.type)}`,
        NotificationPriority.HIGH,
        opportunity
      );
    }
    // فرصت flash
    else if (opportunity.type === 'flash') {
      this.createNotification(
        NotificationType.FLASH_OPPORTUNITY,
        `فرصت فوری! ${profit.toFixed(2)}%`,
        `${opportunity.pair} - زمان محدود: ${opportunity.timeWindow}s`,
        NotificationPriority.CRITICAL,
        opportunity
      );
    }
    // فرصت عادی
    else if (profit >= this.settings.minProfitThreshold) {
      this.createNotification(
        NotificationType.NEW_OPPORTUNITY,
        `فرصت جدید: ${profit.toFixed(2)}%`,
        `${opportunity.pair} - ${this.getStrategyName(opportunity.type)}`,
        NotificationPriority.MEDIUM,
        opportunity
      );
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
   * دریافت نام استراتژی
   */
  private getStrategyName(type: string): string {
    const names: { [key: string]: string } = {
      'spatial': 'آربیتراژ فضایی',
      'triangular': 'آربیتراژ مثلثی',
      'cross-triangular': 'آربیتراژ متقابل',
      'statistical': 'آربیتراژ آماری',
      'flash': 'آربیتراژ فوری',
      'market-making': 'بازارسازی',
      'pairs': 'معاملات جفتی'
    };
    return names[type] || type;
  }

  /**
   * علامت‌گذاری به عنوان خوانده شده
   */
  public markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.notifyListeners();
    }
  }

  /**
   * علامت‌گذاری همه به عنوان خوانده شده
   */
  public markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.notifyListeners();
  }

  /**
   * حذف اعلان
   */
  public removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifyListeners();
  }

  /**
   * پاک کردن همه اعلان‌ها
   */
  public clearAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  /**
   * دریافت اعلان‌ها
   */
  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * دریافت اعلان‌های خوانده نشده
   */
  public getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.isRead);
  }

  /**
   * دریافت تعداد اعلان‌های خوانده نشده
   */
  public getUnreadCount(): number {
    return this.getUnreadNotifications().length;
  }

  /**
   * به‌روزرسانی تنظیمات
   */
  public updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  /**
   * دریافت تنظیمات
   */
  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * اضافه کردن listener
   */
  public addListener(callback: (notifications: Notification[]) => void): void {
    this.listeners.push(callback);
  }

  /**
   * حذف listener
   */
  public removeListener(callback: (notifications: Notification[]) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * اطلاع به listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback([...this.notifications]);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * ایجاد اعلان خطای سیستم
   */
  public notifySystemError(error: Error, context?: any): void {
    this.createNotification(
      NotificationType.SYSTEM_ERROR,
      'خطای سیستم',
      `${error.message}`,
      NotificationPriority.HIGH
    );
  }

  /**
   * ایجاد اعلان تغییر بازار
   */
  public notifyMarketChange(message: string): void {
    this.createNotification(
      NotificationType.MARKET_CHANGE,
      'تغییر بازار',
      message,
      NotificationPriority.MEDIUM
    );
  }
}

// نمونه سراسری سیستم اعلان‌ها
export const globalNotificationSystem = new NotificationSystem();