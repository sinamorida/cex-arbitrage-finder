import ccxt from 'ccxt';
import { CexInfo } from '../types';

/**
 * نتیجه اعتبارسنجی داده‌ها
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * متریک‌های کیفیت داده
 */
export interface DataQualityMetrics {
  completeness: number; // درصد کامل بودن داده‌ها (0-100)
  freshness: number; // تازگی داده‌ها بر حسب ثانیه
  accuracy: number; // دقت داده‌ها (0-100)
  consistency: number; // سازگاری داده‌ها (0-100)
}

/**
 * اعتبارسنجی داده‌های ticker
 */
export const validateTicker = (ticker: ccxt.Ticker, pair: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // بررسی وجود فیلدهای ضروری
  if (!ticker) {
    errors.push('Ticker data is null or undefined');
    return { isValid: false, errors, warnings };
  }

  // بررسی symbol
  if (!ticker.symbol || ticker.symbol !== pair) {
    errors.push(`Invalid or missing symbol. Expected: ${pair}, Got: ${ticker.symbol}`);
  }

  // بررسی قیمت‌های bid و ask
  if (typeof ticker.bid !== 'number' || ticker.bid <= 0) {
    errors.push(`Invalid bid price: ${ticker.bid}`);
  }

  if (typeof ticker.ask !== 'number' || ticker.ask <= 0) {
    errors.push(`Invalid ask price: ${ticker.ask}`);
  }

  // بررسی منطقی بودن spread
  if (ticker.bid && ticker.ask && ticker.bid >= ticker.ask) {
    errors.push(`Invalid spread: bid (${ticker.bid}) >= ask (${ticker.ask})`);
  }

  // بررسی قیمت last
  if (ticker.last && (typeof ticker.last !== 'number' || ticker.last <= 0)) {
    warnings.push(`Invalid last price: ${ticker.last}`);
  }

  // بررسی volume
  if (ticker.baseVolume && (typeof ticker.baseVolume !== 'number' || ticker.baseVolume < 0)) {
    warnings.push(`Invalid base volume: ${ticker.baseVolume}`);
  }

  // بررسی timestamp
  if (!ticker.timestamp || typeof ticker.timestamp !== 'number') {
    warnings.push('Missing or invalid timestamp');
  } else {
    const dataAge = Date.now() - ticker.timestamp;
    if (dataAge > 300000) { // بیش از 5 دقیقه
      warnings.push(`Data is stale: ${Math.floor(dataAge / 1000)}s old`);
    }
  }

  // بررسی spread غیرطبیعی
  if (ticker.bid && ticker.ask) {
    const spread = ((ticker.ask - ticker.bid) / ticker.bid) * 100;
    if (spread > 10) { // spread بیش از 10%
      warnings.push(`Unusually high spread: ${spread.toFixed(2)}%`);
    }
    if (spread < 0.001) { // spread کمتر از 0.001%
      warnings.push(`Unusually low spread: ${spread.toFixed(4)}%`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * اعتبارسنجی داده‌های صرافی
 */
export const validateExchangeData = (data: any, exchange: CexInfo): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    errors.push(`No data received from ${exchange.name}`);
    return { isValid: false, errors, warnings };
  }

  if (!data.tickers || typeof data.tickers !== 'object') {
    errors.push(`Invalid tickers data from ${exchange.name}`);
    return { isValid: false, errors, warnings };
  }

  const tickerCount = Object.keys(data.tickers).length;
  if (tickerCount === 0) {
    warnings.push(`No tickers received from ${exchange.name}`);
  } else if (tickerCount < 5) {
    warnings.push(`Low ticker count from ${exchange.name}: ${tickerCount}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * فیلتر کردن ticker های نامعتبر
 */
export const filterValidTickers = (
  tickers: { [symbol: string]: ccxt.Ticker },
  requiredPairs: string[]
): { [symbol: string]: ccxt.Ticker } => {
  const validTickers: { [symbol: string]: ccxt.Ticker } = {};
  const invalidCount = { total: 0, reasons: {} as { [reason: string]: number } };

  for (const [pair, ticker] of Object.entries(tickers)) {
    const validation = validateTicker(ticker, pair);
    
    if (validation.isValid) {
      validTickers[pair] = ticker;
    } else {
      invalidCount.total++;
      validation.errors.forEach(error => {
        const reason = error.split(':')[0];
        invalidCount.reasons[reason] = (invalidCount.reasons[reason] || 0) + 1;
      });
    }

    // لاگ کردن هشدارها
    if (validation.warnings.length > 0) {
      console.warn(`Ticker warnings for ${pair}:`, validation.warnings);
    }
  }

  if (invalidCount.total > 0) {
    console.warn(`Filtered out ${invalidCount.total} invalid tickers:`, invalidCount.reasons);
  }

  return validTickers;
};

/**
 * محاسبه متریک‌های کیفیت داده
 */
export const calculateDataQuality = (
  tickers: { [symbol: string]: ccxt.Ticker },
  requiredPairs: string[]
): DataQualityMetrics => {
  const totalRequired = requiredPairs.length;
  const availableCount = Object.keys(tickers).length;
  
  // محاسبه کامل بودن
  const completeness = totalRequired > 0 ? (availableCount / totalRequired) * 100 : 0;

  // محاسبه تازگی (میانگین سن داده‌ها)
  const now = Date.now();
  const ages = Object.values(tickers)
    .filter(ticker => ticker.timestamp)
    .map(ticker => now - ticker.timestamp!);
  
  const avgAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;
  const freshness = Math.max(0, 100 - (avgAge / 1000 / 60)); // کاهش امتیاز بر اساس دقیقه

  // محاسبه دقت (بر اساس spread های منطقی)
  const validSpreads = Object.values(tickers)
    .filter(ticker => ticker.bid && ticker.ask)
    .map(ticker => ((ticker.ask! - ticker.bid!) / ticker.bid!) * 100)
    .filter(spread => spread > 0 && spread < 10); // spread های منطقی

  const accuracy = validSpreads.length > 0 ? 
    Math.min(100, 100 - (validSpreads.reduce((sum, spread) => sum + Math.abs(spread - 0.1), 0) / validSpreads.length)) : 0;

  // محاسبه سازگاری (بر اساس تعداد خطاهای اعتبارسنجی)
  let totalErrors = 0;
  let totalChecks = 0;
  
  Object.entries(tickers).forEach(([pair, ticker]) => {
    const validation = validateTicker(ticker, pair);
    totalErrors += validation.errors.length;
    totalChecks++;
  });

  const consistency = totalChecks > 0 ? Math.max(0, 100 - (totalErrors / totalChecks) * 20) : 100;

  return {
    completeness: Math.round(completeness),
    freshness: Math.round(freshness),
    accuracy: Math.round(accuracy),
    consistency: Math.round(consistency)
  };
};

/**
 * تشخیص ناهنجاری‌های آماری در قیمت‌ها
 */
export const detectPriceAnomalies = (
  tickers: { [symbol: string]: ccxt.Ticker },
  pair: string
): { isAnomaly: boolean; reason?: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' } => {
  const ticker = tickers[pair];
  if (!ticker || !ticker.bid || !ticker.ask || !ticker.last) {
    return { isAnomaly: false, severity: 'LOW' };
  }

  // بررسی انحراف قیمت last از میانگین bid/ask
  const midPrice = (ticker.bid + ticker.ask) / 2;
  const lastDeviation = Math.abs(ticker.last - midPrice) / midPrice;

  if (lastDeviation > 0.05) { // انحراف بیش از 5%
    return {
      isAnomaly: true,
      reason: `Last price deviates ${(lastDeviation * 100).toFixed(2)}% from mid-price`,
      severity: lastDeviation > 0.1 ? 'HIGH' : 'MEDIUM'
    };
  }

  // بررسی spread غیرطبیعی
  const spread = (ticker.ask - ticker.bid) / ticker.bid;
  if (spread > 0.02) { // spread بیش از 2%
    return {
      isAnomaly: true,
      reason: `Unusually high spread: ${(spread * 100).toFixed(2)}%`,
      severity: spread > 0.05 ? 'HIGH' : 'MEDIUM'
    };
  }

  return { isAnomaly: false, severity: 'LOW' };
};

/**
 * اعتبارسنجی فرصت آربیتراژ
 */
export const validateArbitrageOpportunity = (
  buyPrice: number,
  sellPrice: number,
  minProfitThreshold: number
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (buyPrice <= 0) {
    errors.push(`Invalid buy price: ${buyPrice}`);
  }

  if (sellPrice <= 0) {
    errors.push(`Invalid sell price: ${sellPrice}`);
  }

  if (buyPrice >= sellPrice) {
    errors.push(`Buy price (${buyPrice}) >= sell price (${sellPrice})`);
  }

  const profit = ((sellPrice - buyPrice) / buyPrice) * 100;
  if (profit < minProfitThreshold) {
    warnings.push(`Profit ${profit.toFixed(3)}% below threshold ${minProfitThreshold}%`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};