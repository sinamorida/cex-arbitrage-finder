import ccxt from 'ccxt';
import { CexInfo } from '../types';

/**
 * اطلاعات order book
 */
export interface OrderBookData {
  symbol: string;
  exchange: CexInfo;
  bids: [number, number][]; // [price, amount]
  asks: [number, number][]; // [price, amount]
  timestamp: number;
}

/**
 * تحلیل نقدینگی
 */
export interface LiquidityAnalysis {
  symbol: string;
  exchange: CexInfo;
  liquidityScore: number; // 0-100
  bidLiquidity: number;
  askLiquidity: number;
  spread: number;
  spreadPercentage: number;
  marketDepth: {
    depth1Percent: number; // نقدینگی در 1% از قیمت فعلی
    depth5Percent: number; // نقدینگی در 5% از قیمت فعلی
    depth10Percent: number; // نقدینگی در 10% از قیمت فعلی
  };
  slippageEstimate: {
    buy1000: number; // slippage برای خرید $1000
    sell1000: number; // slippage برای فروش $1000
    buy10000: number; // slippage برای خرید $10000
    sell10000: number; // slippage برای فروش $10000
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
}

/**
 * تنظیمات تحلیل نقدینگی
 */
export interface LiquiditySettings {
  minLiquidityThreshold: number; // حداقل نقدینگی مورد نیاز
  maxSlippageThreshold: number; // حداکثر slippage قابل قبول
  orderBookDepth: number; // عمق order book برای تحلیل
  updateInterval: number; // فاصله به‌روزرسانی (میلی‌ثانیه)
}

/**
 * کلاس تحلیل نقدینگی
 */
export class LiquidityAnalyzer {
  private settings: LiquiditySettings;
  private orderBookCache: Map<string, OrderBookData> = new Map();
  private analysisCache: Map<string, LiquidityAnalysis> = new Map();

  constructor() {
    this.settings = {
      minLiquidityThreshold: 10000, // $10,000
      maxSlippageThreshold: 0.5, // 0.5%
      orderBookDepth: 20, // 20 سطح
      updateInterval: 30000 // 30 ثانیه
    };
  }

  /**
   * دریافت order book از صرافی
   */
  public async fetchOrderBook(
    exchange: ccxt.Exchange,
    symbol: string,
    cexInfo: CexInfo
  ): Promise<OrderBookData | null> {
    try {
      const orderBook = await exchange.fetchOrderBook(symbol, this.settings.orderBookDepth);
      
      const data: OrderBookData = {
        symbol,
        exchange: cexInfo,
        bids: orderBook.bids || [],
        asks: orderBook.asks || [],
        timestamp: orderBook.timestamp || Date.now()
      };

      // ذخیره در cache
      const cacheKey = `${cexInfo.id}-${symbol}`;
      this.orderBookCache.set(cacheKey, data);

      return data;
    } catch (error) {
      console.warn(`Failed to fetch order book for ${symbol} on ${cexInfo.name}:`, error);
      return null;
    }
  }

  /**
   * تحلیل نقدینگی بر اساس order book
   */
  public analyzeLiquidity(orderBook: OrderBookData): LiquidityAnalysis {
    const { symbol, exchange, bids, asks, timestamp } = orderBook;
    
    if (bids.length === 0 || asks.length === 0) {
      return this.createEmptyAnalysis(symbol, exchange, timestamp);
    }

    const bestBid = bids[0][0];
    const bestAsk = asks[0][0];
    const midPrice = (bestBid + bestAsk) / 2;
    const spread = bestAsk - bestBid;
    const spreadPercentage = (spread / midPrice) * 100;

    // محاسبه نقدینگی bid و ask
    const bidLiquidity = this.calculateSideLiquidity(bids, midPrice);
    const askLiquidity = this.calculateSideLiquidity(asks, midPrice);

    // محاسبه عمق بازار
    const marketDepth = this.calculateMarketDepth(bids, asks, midPrice);

    // تخمین slippage
    const slippageEstimate = this.estimateSlippage(bids, asks, midPrice);

    // محاسبه امتیاز نقدینگی
    const liquidityScore = this.calculateLiquidityScore(
      bidLiquidity,
      askLiquidity,
      spreadPercentage,
      marketDepth
    );

    // تعیین سطح ریسک
    const riskLevel = this.assessLiquidityRisk(liquidityScore, spreadPercentage, slippageEstimate);

    const analysis: LiquidityAnalysis = {
      symbol,
      exchange,
      liquidityScore,
      bidLiquidity,
      askLiquidity,
      spread,
      spreadPercentage,
      marketDepth,
      slippageEstimate,
      riskLevel,
      timestamp
    };

    // ذخیره در cache
    const cacheKey = `${exchange.id}-${symbol}`;
    this.analysisCache.set(cacheKey, analysis);

    return analysis;
  }

  /**
   * محاسبه نقدینگی یک طرف (bid یا ask)
   */
  private calculateSideLiquidity(orders: [number, number][], midPrice: number): number {
    let totalLiquidity = 0;
    
    for (const [price, amount] of orders) {
      const value = price * amount;
      totalLiquidity += value;
    }

    return totalLiquidity;
  }

  /**
   * محاسبه عمق بازار
   */
  private calculateMarketDepth(
    bids: [number, number][],
    asks: [number, number][],
    midPrice: number
  ): LiquidityAnalysis['marketDepth'] {
    const calculateDepthForRange = (percentage: number) => {
      const lowerBound = midPrice * (1 - percentage / 100);
      const upperBound = midPrice * (1 + percentage / 100);

      let bidDepth = 0;
      let askDepth = 0;

      // محاسبه عمق bid
      for (const [price, amount] of bids) {
        if (price >= lowerBound) {
          bidDepth += price * amount;
        }
      }

      // محاسبه عمق ask
      for (const [price, amount] of asks) {
        if (price <= upperBound) {
          askDepth += price * amount;
        }
      }

      return bidDepth + askDepth;
    };

    return {
      depth1Percent: calculateDepthForRange(1),
      depth5Percent: calculateDepthForRange(5),
      depth10Percent: calculateDepthForRange(10)
    };
  }

  /**
   * تخمین slippage
   */
  private estimateSlippage(
    bids: [number, number][],
    asks: [number, number][],
    midPrice: number
  ): LiquidityAnalysis['slippageEstimate'] {
    const estimateSlippageForAmount = (orders: [number, number][], targetValue: number, isBuy: boolean) => {
      let remainingValue = targetValue;
      let totalCost = 0;
      let totalAmount = 0;

      for (const [price, amount] of orders) {
        const orderValue = price * amount;
        
        if (remainingValue <= orderValue) {
          // این order کافی است
          const neededAmount = remainingValue / price;
          totalCost += remainingValue;
          totalAmount += neededAmount;
          break;
        } else {
          // تمام این order را مصرف می‌کنیم
          totalCost += orderValue;
          totalAmount += amount;
          remainingValue -= orderValue;
        }
      }

      if (remainingValue > 0) {
        // نقدینگی کافی نیست
        return 10; // 10% slippage به عنوان جریمه
      }

      const averagePrice = totalCost / totalAmount;
      const slippage = Math.abs(averagePrice - midPrice) / midPrice * 100;
      return slippage;
    };

    return {
      buy1000: estimateSlippageForAmount(asks, 1000, true),
      sell1000: estimateSlippageForAmount(bids, 1000, false),
      buy10000: estimateSlippageForAmount(asks, 10000, true),
      sell10000: estimateSlippageForAmount(bids, 10000, false)
    };
  }

  /**
   * محاسبه امتیاز نقدینگی
   */
  private calculateLiquidityScore(
    bidLiquidity: number,
    askLiquidity: number,
    spreadPercentage: number,
    marketDepth: LiquidityAnalysis['marketDepth']
  ): number {
    // امتیاز بر اساس نقدینگی کل
    const totalLiquidity = bidLiquidity + askLiquidity;
    let liquidityScore = Math.min(100, (totalLiquidity / 100000) * 50); // حداکثر 50 امتیاز

    // امتیاز بر اساس spread
    const spreadScore = Math.max(0, 30 - (spreadPercentage * 10)); // حداکثر 30 امتیاز
    liquidityScore += spreadScore;

    // امتیاز بر اساس عمق بازار
    const depthScore = Math.min(20, (marketDepth.depth5Percent / 50000) * 20); // حداکثر 20 امتیاز
    liquidityScore += depthScore;

    return Math.round(Math.min(100, liquidityScore));
  }

  /**
   * ارزیابی ریسک نقدینگی
   */
  private assessLiquidityRisk(
    liquidityScore: number,
    spreadPercentage: number,
    slippageEstimate: LiquidityAnalysis['slippageEstimate']
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;

    // ریسک بر اساس امتیاز نقدینگی
    if (liquidityScore < 30) riskScore += 3;
    else if (liquidityScore < 60) riskScore += 2;
    else if (liquidityScore < 80) riskScore += 1;

    // ریسک بر اساس spread
    if (spreadPercentage > 1) riskScore += 2;
    else if (spreadPercentage > 0.5) riskScore += 1;

    // ریسک بر اساس slippage
    const avgSlippage = (slippageEstimate.buy1000 + slippageEstimate.sell1000) / 2;
    if (avgSlippage > 1) riskScore += 2;
    else if (avgSlippage > 0.5) riskScore += 1;

    if (riskScore >= 5) return 'HIGH';
    if (riskScore >= 3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * ایجاد تحلیل خالی
   */
  private createEmptyAnalysis(symbol: string, exchange: CexInfo, timestamp: number): LiquidityAnalysis {
    return {
      symbol,
      exchange,
      liquidityScore: 0,
      bidLiquidity: 0,
      askLiquidity: 0,
      spread: 0,
      spreadPercentage: 0,
      marketDepth: {
        depth1Percent: 0,
        depth5Percent: 0,
        depth10Percent: 0
      },
      slippageEstimate: {
        buy1000: 10,
        sell1000: 10,
        buy10000: 10,
        sell10000: 10
      },
      riskLevel: 'HIGH',
      timestamp
    };
  }

  /**
   * اعتبارسنجی فرصت بر اساس نقدینگی
   */
  public validateOpportunityLiquidity(
    symbol: string,
    exchanges: CexInfo[],
    tradeAmount: number
  ): { isValid: boolean; reason?: string; liquidityData?: LiquidityAnalysis[] } {
    const liquidityData: LiquidityAnalysis[] = [];
    
    for (const exchange of exchanges) {
      const cacheKey = `${exchange.id}-${symbol}`;
      const analysis = this.analysisCache.get(cacheKey);
      
      if (!analysis) {
        return {
          isValid: false,
          reason: `No liquidity data available for ${symbol} on ${exchange.name}`
        };
      }

      liquidityData.push(analysis);

      // بررسی حداقل نقدینگی
      const totalLiquidity = analysis.bidLiquidity + analysis.askLiquidity;
      if (totalLiquidity < this.settings.minLiquidityThreshold) {
        return {
          isValid: false,
          reason: `Insufficient liquidity on ${exchange.name}: $${totalLiquidity.toFixed(0)} < $${this.settings.minLiquidityThreshold}`,
          liquidityData
        };
      }

      // بررسی slippage
      const relevantSlippage = tradeAmount <= 1000 ? 
        Math.max(analysis.slippageEstimate.buy1000, analysis.slippageEstimate.sell1000) :
        Math.max(analysis.slippageEstimate.buy10000, analysis.slippageEstimate.sell10000);

      if (relevantSlippage > this.settings.maxSlippageThreshold) {
        return {
          isValid: false,
          reason: `High slippage on ${exchange.name}: ${relevantSlippage.toFixed(2)}% > ${this.settings.maxSlippageThreshold}%`,
          liquidityData
        };
      }
    }

    return { isValid: true, liquidityData };
  }

  /**
   * دریافت تحلیل نقدینگی از cache
   */
  public getLiquidityAnalysis(exchange: CexInfo, symbol: string): LiquidityAnalysis | null {
    const cacheKey = `${exchange.id}-${symbol}`;
    return this.analysisCache.get(cacheKey) || null;
  }

  /**
   * پاک کردن cache
   */
  public clearCache(): void {
    this.orderBookCache.clear();
    this.analysisCache.clear();
  }

  /**
   * به‌روزرسانی تنظیمات
   */
  public updateSettings(newSettings: Partial<LiquiditySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * دریافت تنظیمات
   */
  public getSettings(): LiquiditySettings {
    return { ...this.settings };
  }

  /**
   * دریافت آمار نقدینگی
   */
  public getLiquidityStats(): {
    totalAnalyses: number;
    averageLiquidityScore: number;
    highRiskCount: number;
    lowLiquidityCount: number;
  } {
    const analyses = Array.from(this.analysisCache.values());
    
    if (analyses.length === 0) {
      return {
        totalAnalyses: 0,
        averageLiquidityScore: 0,
        highRiskCount: 0,
        lowLiquidityCount: 0
      };
    }

    const averageLiquidityScore = analyses.reduce((sum, a) => sum + a.liquidityScore, 0) / analyses.length;
    const highRiskCount = analyses.filter(a => a.riskLevel === 'HIGH').length;
    const lowLiquidityCount = analyses.filter(a => a.liquidityScore < 30).length;

    return {
      totalAnalyses: analyses.length,
      averageLiquidityScore: Math.round(averageLiquidityScore),
      highRiskCount,
      lowLiquidityCount
    };
  }
}

// نمونه سراسری تحلیلگر نقدینگی
export const globalLiquidityAnalyzer = new LiquidityAnalyzer();