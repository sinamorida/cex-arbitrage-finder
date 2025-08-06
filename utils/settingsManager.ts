/**
 * تنظیمات کلی اپلیکیشن
 */
export interface AppSettings {
  // تنظیمات عمومی
  general: {
    language: 'fa' | 'en';
    theme: 'dark' | 'light' | 'auto';
    refreshInterval: number; // میلی‌ثانیه
    autoRefresh: boolean;
    soundEnabled: boolean;
  };

  // تنظیمات آربیتراژ
  arbitrage: {
    minProfitThreshold: number; // درصد
    maxRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    enabledStrategies: string[];
    priorityStrategy: string;
    executionMode: 'MANUAL' | 'SEMI_AUTO' | 'AUTO';
  };

  // تنظیمات صرافی‌ها
  exchanges: {
    enabledExchanges: string[];
    exchangePriority: { [exchangeId: string]: number };
    apiKeys: { [exchangeId: string]: { key: string; secret: string; passphrase?: string } };
    rateLimits: { [exchangeId: string]: number };
  };

  // تنظیمات جفت ارزها
  pairs: {
    enabledPairs: string[];
    pairPriority: { [pair: string]: number };
    customPairs: string[];
    excludedPairs: string[];
  };

  // تنظیمات اعلان‌ها
  notifications: {
    enabled: boolean;
    audioEnabled: boolean;
    desktopEnabled: boolean;
    minProfitThreshold: number;
    enabledTypes: string[];
    priorityFilter: string[];
    autoHideDelay: number;
    maxNotifications: number;
  };

  // تنظیمات فیلتر
  filters: {
    defaultFilter: string;
    savedFilters: { [name: string]: any };
    autoApplyFilter: boolean;
    rememberLastFilter: boolean;
  };

  // تنظیمات نمایش
  display: {
    itemsPerPage: number;
    showDetailsByDefault: boolean;
    compactMode: boolean;
    showSystemHealth: boolean;
    showMarketAnalysis: boolean;
    cardAnimations: boolean;
  };

  // تنظیمات پیشرفته
  advanced: {
    debugMode: boolean;
    logLevel: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
    cacheEnabled: boolean;
    cacheTTL: number;
    maxRetries: number;
    timeoutDuration: number;
  };
}

/**
 * تنظیمات پیش‌فرض
 */
const DEFAULT_SETTINGS: AppSettings = {
  general: {
    language: 'fa',
    theme: 'dark',
    refreshInterval: 30000,
    autoRefresh: true,
    soundEnabled: true
  },
  arbitrage: {
    minProfitThreshold: 0.1,
    maxRiskLevel: 'MEDIUM',
    enabledStrategies: ['spatial', 'triangular', 'statistical', 'flash', 'market-making', 'pairs'],
    priorityStrategy: 'spatial',
    executionMode: 'MANUAL'
  },
  exchanges: {
    enabledExchanges: ['binance', 'kraken', 'coinbase', 'kucoin', 'bybit'],
    exchangePriority: {
      binance: 1,
      kraken: 2,
      coinbase: 3,
      kucoin: 4,
      bybit: 5
    },
    apiKeys: {},
    rateLimits: {}
  },
  pairs: {
    enabledPairs: [
      'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'DOGE/USDT',
      'ADA/USDT', 'LINK/USDT', 'MATIC/USDT', 'LTC/USDT', 'BCH/USDT'
    ],
    pairPriority: {},
    customPairs: [],
    excludedPairs: []
  },
  notifications: {
    enabled: true,
    audioEnabled: true,
    desktopEnabled: true,
    minProfitThreshold: 0.5,
    enabledTypes: ['high_profit', 'flash_opportunity', 'system_error'],
    priorityFilter: ['MEDIUM', 'HIGH', 'CRITICAL'],
    autoHideDelay: 5000,
    maxNotifications: 10
  },
  filters: {
    defaultFilter: 'all',
    savedFilters: {},
    autoApplyFilter: false,
    rememberLastFilter: true
  },
  display: {
    itemsPerPage: 20,
    showDetailsByDefault: false,
    compactMode: false,
    showSystemHealth: true,
    showMarketAnalysis: true,
    cardAnimations: true
  },
  advanced: {
    debugMode: false,
    logLevel: 'INFO',
    cacheEnabled: true,
    cacheTTL: 300000,
    maxRetries: 3,
    timeoutDuration: 30000
  }
};

/**
 * رویدادهای تغییر تنظیمات
 */
export interface SettingsChangeEvent {
  section: keyof AppSettings;
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

/**
 * کلاس مدیریت تنظیمات
 */
export class SettingsManager {
  private settings: AppSettings;
  private listeners: ((event: SettingsChangeEvent) => void)[] = [];
  private storageKey = 'arbitrage-app-settings';

  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * بارگذاری تنظیمات از localStorage
   */
  private loadSettings(): AppSettings {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        // ادغام با تنظیمات پیش‌فرض برای اطمینان از وجود تمام کلیدها
        return this.mergeSettings(DEFAULT_SETTINGS, parsedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * ادغام تنظیمات
   */
  private mergeSettings(defaults: AppSettings, saved: Partial<AppSettings>): AppSettings {
    const merged = { ...defaults };
    
    Object.keys(saved).forEach(sectionKey => {
      const section = sectionKey as keyof AppSettings;
      if (merged[section] && saved[section]) {
        merged[section] = { ...merged[section], ...saved[section] };
      }
    });

    return merged;
  }

  /**
   * ذخیره تنظیمات در localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * دریافت تمام تنظیمات
   */
  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * دریافت بخش خاصی از تنظیمات
   */
  public getSection<T extends keyof AppSettings>(section: T): AppSettings[T] {
    return { ...this.settings[section] };
  }

  /**
   * دریافت مقدار خاص
   */
  public getValue<T extends keyof AppSettings, K extends keyof AppSettings[T]>(
    section: T,
    key: K
  ): AppSettings[T][K] {
    return this.settings[section][key];
  }

  /**
   * تنظیم مقدار خاص
   */
  public setValue<T extends keyof AppSettings, K extends keyof AppSettings[T]>(
    section: T,
    key: K,
    value: AppSettings[T][K]
  ): void {
    const oldValue = this.settings[section][key];
    
    if (oldValue !== value) {
      this.settings[section][key] = value;
      this.saveSettings();
      
      // اطلاع به listeners
      const event: SettingsChangeEvent = {
        section,
        key: key as string,
        oldValue,
        newValue: value,
        timestamp: Date.now()
      };
      
      this.notifyListeners(event);
    }
  }

  /**
   * به‌روزرسانی بخش کامل
   */
  public updateSection<T extends keyof AppSettings>(
    section: T,
    updates: Partial<AppSettings[T]>
  ): void {
    const oldSection = { ...this.settings[section] };
    this.settings[section] = { ...this.settings[section], ...updates };
    this.saveSettings();

    // اطلاع به listeners برای هر تغییر
    Object.keys(updates).forEach(key => {
      const typedKey = key as keyof AppSettings[T];
      if (oldSection[typedKey] !== updates[typedKey]) {
        const event: SettingsChangeEvent = {
          section,
          key,
          oldValue: oldSection[typedKey],
          newValue: updates[typedKey],
          timestamp: Date.now()
        };
        this.notifyListeners(event);
      }
    });
  }

  /**
   * ریست کردن تنظیمات به حالت پیش‌فرض
   */
  public resetToDefaults(): void {
    const oldSettings = { ...this.settings };
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();

    // اطلاع به listeners
    const event: SettingsChangeEvent = {
      section: 'general' as keyof AppSettings,
      key: 'reset_all',
      oldValue: oldSettings,
      newValue: this.settings,
      timestamp: Date.now()
    };
    this.notifyListeners(event);
  }

  /**
   * ریست کردن بخش خاص
   */
  public resetSection<T extends keyof AppSettings>(section: T): void {
    const oldSection = { ...this.settings[section] };
    this.settings[section] = { ...DEFAULT_SETTINGS[section] };
    this.saveSettings();

    const event: SettingsChangeEvent = {
      section,
      key: 'reset_section',
      oldValue: oldSection,
      newValue: this.settings[section],
      timestamp: Date.now()
    };
    this.notifyListeners(event);
  }

  /**
   * صادرات تنظیمات
   */
  public exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * وارد کردن تنظیمات
   */
  public importSettings(settingsJson: string): boolean {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      // اعتبارسنجی ساختار
      if (this.validateSettingsStructure(importedSettings)) {
        const oldSettings = { ...this.settings };
        this.settings = this.mergeSettings(DEFAULT_SETTINGS, importedSettings);
        this.saveSettings();

        const event: SettingsChangeEvent = {
          section: 'general' as keyof AppSettings,
          key: 'import_all',
          oldValue: oldSettings,
          newValue: this.settings,
          timestamp: Date.now()
        };
        this.notifyListeners(event);

        return true;
      }
    } catch (error) {
      console.error('Error importing settings:', error);
    }
    return false;
  }

  /**
   * اعتبارسنجی ساختار تنظیمات
   */
  private validateSettingsStructure(settings: any): boolean {
    if (!settings || typeof settings !== 'object') return false;
    
    // بررسی وجود بخش‌های اصلی
    const requiredSections = ['general', 'arbitrage', 'exchanges', 'pairs', 'notifications'];
    return requiredSections.every(section => settings[section] && typeof settings[section] === 'object');
  }

  /**
   * دریافت تنظیمات پیش‌فرض
   */
  public getDefaults(): AppSettings {
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * بررسی تغییر تنظیمات نسبت به پیش‌فرض
   */
  public hasChanges(): boolean {
    return JSON.stringify(this.settings) !== JSON.stringify(DEFAULT_SETTINGS);
  }

  /**
   * دریافت لیست تغییرات
   */
  public getChanges(): { section: string; key: string; defaultValue: any; currentValue: any }[] {
    const changes: { section: string; key: string; defaultValue: any; currentValue: any }[] = [];
    
    Object.keys(this.settings).forEach(sectionKey => {
      const section = sectionKey as keyof AppSettings;
      const currentSection = this.settings[section];
      const defaultSection = DEFAULT_SETTINGS[section];
      
      Object.keys(currentSection).forEach(key => {
        const typedKey = key as keyof typeof currentSection;
        if (JSON.stringify(currentSection[typedKey]) !== JSON.stringify(defaultSection[typedKey])) {
          changes.push({
            section: sectionKey,
            key,
            defaultValue: defaultSection[typedKey],
            currentValue: currentSection[typedKey]
          });
        }
      });
    });
    
    return changes;
  }

  /**
   * اضافه کردن listener
   */
  public addListener(callback: (event: SettingsChangeEvent) => void): void {
    this.listeners.push(callback);
  }

  /**
   * حذف listener
   */
  public removeListener(callback: (event: SettingsChangeEvent) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * اطلاع به listeners
   */
  private notifyListeners(event: SettingsChangeEvent): void {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in settings listener:', error);
      }
    });
  }

  /**
   * ایجاد پروفایل تنظیمات
   */
  public createProfile(name: string): boolean {
    try {
      const profiles = this.getProfiles();
      profiles[name] = { ...this.settings };
      localStorage.setItem('arbitrage-settings-profiles', JSON.stringify(profiles));
      return true;
    } catch (error) {
      console.error('Error creating profile:', error);
      return false;
    }
  }

  /**
   * بارگذاری پروفایل
   */
  public loadProfile(name: string): boolean {
    try {
      const profiles = this.getProfiles();
      if (profiles[name]) {
        const oldSettings = { ...this.settings };
        this.settings = { ...profiles[name] };
        this.saveSettings();

        const event: SettingsChangeEvent = {
          section: 'general' as keyof AppSettings,
          key: 'load_profile',
          oldValue: oldSettings,
          newValue: this.settings,
          timestamp: Date.now()
        };
        this.notifyListeners(event);

        return true;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    return false;
  }

  /**
   * دریافت لیست پروفایل‌ها
   */
  public getProfiles(): { [name: string]: AppSettings } {
    try {
      const saved = localStorage.getItem('arbitrage-settings-profiles');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error getting profiles:', error);
      return {};
    }
  }

  /**
   * حذف پروفایل
   */
  public deleteProfile(name: string): boolean {
    try {
      const profiles = this.getProfiles();
      delete profiles[name];
      localStorage.setItem('arbitrage-settings-profiles', JSON.stringify(profiles));
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  }
}

// نمونه سراسری مدیریت تنظیمات
export const globalSettingsManager = new SettingsManager();