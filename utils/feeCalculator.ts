import { CexInfo } from '../types';

/**
 * ساختار کارمزد صرافی
 */
export interface FeeStructure {
  maker: number; // کارمزد maker (درصد)
  taker: number; // کارمزد taker (درصد)
  withdrawal: { [currency: string]: number }; // کارمزد برداشت
}

/**
 * محاسبه slippage
 */
export interface SlippageCalculation {
  estimatedSlippage: number; // درصد
  adjustedPrice: number;
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * نتیجه محاسبه کارمزد
 */
export interface FeeCalculation {
  tradingFees: number; // کل کارمزد معاملات
  withdrawalFees: number; // کل کارمزد برداشت
  slippage: number; // کل slippage
  totalCost: number; // کل هزینه
  netProfit: number; // سود خالص
  netProfitPercentage: number; // درصد سود خالص
}

/**
 * کارمزدهای صرافی‌ها
 */
const EXCHANGE_FEES: { [exchangeId: string]: FeeStructure } = {
  binance: {
    maker: 0.1, // 0.1%
    taker: 0.1,
    withdrawal: {
      BTC: 0.0005,
      ETH: 0.005,
      USDT: 1.0,
      SOL: 0.01,
      XRP: 0.25,
      ADA: 1.0,
      LINK: 0.1,
      MATIC: 0.1,
      LTC: 0.001,
      BCH: 0.001
    }
  },
  kraken: {
    maker: 0.16,
    taker: 0.26,
    withdrawal: {
      BTC: 0.00015,
      ETH: 0.0025,
      USDT: 5.0,
      SOL: 0.01,
      XRP: 0.02,
      ADA: 0.2,
      LINK: 0.005,
      LTC: 0.0002,
      BCH: 0.0001
    }
  },
  coinbase: {
    maker: 0.5,
    taker: 0.5,
    withdrawal: {
      BTC: 0.0005,
      ETH: 0.0035,
      USDT: 2.5,
      SOL: 0.01,
      XRP: 0.02,
      ADA: 0.15,
      LINK: 0.01,
      LTC: 0.001,
      BCH: 0.001
    }
  },
  kucoin: {
    maker: 0.1,
    taker: 0.1,
    withdrawal: {
      BTC: 0.0005,
      ETH: 0.005,
      USDT: 1.0,
      SOL: 0.01,
      XRP: 0.25,
      ADA: 1.0,
      LINK: 0.1,
      MATIC: 1.0,
      LTC: 0.001,
      BCH: 0.001
    }
  },
  bybit: {
    maker: 0.1,
    taker: 0.1,
    withdrawal: {
      BTC: 0.0005,
      ETH: 0.005,
      USDT: 1.0,
      SOL: 0.01,
      XRP: 0.25,
      ADA: 1.0,
      LINK: 0.1,
      MATIC: 1.0,
      LTC: 0.001,
      BCH: 0.001
    }
  }
};

/**
 * کلاس محاسبه کارمزد و slippage
 */
export class FeeCalculator {
  
  /**
   * دریافت ساختار کارمزد صرافی
   */
  private getFeeStructure(exchangeId: string): FeeStructure {
    return EXCHANGE_FEES[exchangeId] || {
      maker: 0.2, // کارمزد پیش‌فرض
      taker: 0.2,
      withdrawal: {}
    };
  }

  /**
   * محاسبه slippage بر اساس حجم معاملات
   */
  calculateSlippage(
    pair: string,
    tradeAmount: number,
    marketVolume: number,
    spread: number
  ): SlippageCalculation {
    // محاسبه نسبت حجم معامله به حجم بازار
    const volumeRatio = tradeAmount / Math.max(marketVolume, 1);
    
    // محاسبه slippage بر اساس نسبت حجم
    let baseSlippage = 0;
    if (volumeRatio > 0.1) { // بیش از 10% حجم بازار
      baseSlippage = 0.5; // 0.5%
    } else if (volumeRatio > 0.05) { // 5-10% حجم بازار
      baseSlippage = 0.2; // 0.2%
    } else if (volumeRatio > 0.01) { // 1-5% حجم بازار
      baseSlippage = 0.1; // 0.1%
    } else {
      baseSlippage = 0.05; // 0.05%
    }

    // اضافه کردن تأثیر spread
    const spreadImpact = (spread / 2) * 100; // نیمی از spread
    const totalSlippage = baseSlippage + spreadImpact;

    // تعیین سطح تأثیر
    let impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (totalSlippage > 0.5) impactLevel = 'HIGH';
    else if (totalSlippage > 0.2) impactLevel = 'MEDIUM';

    // قیمت تعدیل شده
    const currentPrice = this.getEstimatedPrice(pair);
    const adjustedPrice = currentPrice * (1 + totalSlippage / 100);

    return {
      estimatedSlippage: totalSlippage,
      adjustedPrice,
      impactLevel
    };
  }

  /**
   * محاسبه کارمزد معاملات
   */
  calculateTradingFees(
    exchanges: CexInfo[],
    tradeAmount: number,
    isMaker: boolean = false
  ): number {
    let totalFees = 0;

    exchanges.forEach(exchange => {
      const feeStructure = this.getFeeStructure(exchange.id);
      const feeRate = isMaker ? feeStructure.maker : feeStructure.taker;
      totalFees += (tradeAmount * feeRate) / 100;
    });

    return totalFees;
  }

  /**
   * محاسبه کارمزد برداشت
   */
  calculateWithdrawalFees(
    fromExchange: CexInfo,
    toExchange: CexInfo,
    currency: string,
    amount: number
  ): number {
    const fromFees = this.getFeeStructure(fromExchange.id);
    const withdrawalFee = fromFees.withdrawal[currency] || 0;
    
    // کارمزد برداشت معمولاً ثابت است، نه درصدی
    return withdrawalFee;
  }

  /**
   * محاسبه کامل کارمزد برای spatial arbitrage
   */
  calculateSpatialArbitrageFees(
    buyExchange: CexInfo,
    sellExchange: CexInfo,
    pair: string,
    tradeAmount: number,
    buyPrice: number,
    sellPrice: number,
    marketVolume: number = 10000
  ): FeeCalculation {
    const [baseCurrency] = pair.split('/');
    const spread = Math.abs(sellPrice - buyPrice) / buyPrice;

    // محاسبه slippage
    const buySlippage = this.calculateSlippage(pair, tradeAmount, marketVolume, spread);
    const sellSlippage = this.calculateSlippage(pair, tradeAmount, marketVolume, spread);

    // محاسبه کارمزد معاملات
    const buyTradingFee = this.calculateTradingFees([buyExchange], tradeAmount * buyPrice, false);
    const sellTradingFee = this.calculateTradingFees([sellExchange], tradeAmount * sellPrice, false);
    const totalTradingFees = buyTradingFee + sellTradingFee;

    // محاسبه کارمزد برداشت
    const withdrawalFees = this.calculateWithdrawalFees(
      buyExchange,
      sellExchange,
      baseCurrency,
      tradeAmount
    );

    // محاسبه slippage کل
    const totalSlippage = (buySlippage.estimatedSlippage + sellSlippage.estimatedSlippage) / 100;
    const slippageCost = tradeAmount * sellPrice * totalSlippage;

    // محاسبه سود ناخالص
    const grossProfit = tradeAmount * (sellPrice - buyPrice);
    
    // محاسبه کل هزینه‌ها
    const totalCost = totalTradingFees + withdrawalFees + slippageCost;
    
    // محاسبه سود خالص
    const netProfit = grossProfit - totalCost;
    const netProfitPercentage = (netProfit / (tradeAmount * buyPrice)) * 100;

    return {
      tradingFees: totalTradingFees,
      withdrawalFees,
      slippage: slippageCost,
      totalCost,
      netProfit,
      netProfitPercentage
    };
  }

  /**
   * محاسبه کارمزد برای triangular arbitrage
   */
  calculateTriangularArbitrageFees(
    exchange: CexInfo,
    steps: { pair: string; action: 'BUY' | 'SELL'; price: number }[],
    initialAmount: number
  ): FeeCalculation {
    let currentAmount = initialAmount;
    let totalTradingFees = 0;
    let totalSlippageCost = 0;

    // محاسبه کارمزد و slippage برای هر مرحله
    steps.forEach((step, index) => {
      const tradeValue = currentAmount * step.price;
      
      // کارمزد معاملات
      const tradingFee = this.calculateTradingFees([exchange], tradeValue, false);
      totalTradingFees += tradingFee;

      // Slippage
      const slippage = this.calculateSlippage(step.pair, currentAmount, 5000, 0.001);
      const slippageCost = tradeValue * (slippage.estimatedSlippage / 100);
      totalSlippageCost += slippageCost;

      // به‌روزرسانی مقدار برای مرحله بعد
      if (step.action === 'BUY') {
        currentAmount = (currentAmount - tradingFee - slippageCost) / step.price;
      } else {
        currentAmount = (currentAmount * step.price) - tradingFee - slippageCost;
      }
    });

    // محاسبه سود
    const grossProfit = currentAmount - initialAmount;
    const totalCost = totalTradingFees + totalSlippageCost;
    const netProfit = grossProfit - (totalCost / steps[0].price); // تبدیل به واحد اولیه
    const netProfitPercentage = (netProfit / initialAmount) * 100;

    return {
      tradingFees: totalTradingFees,
      withdrawalFees: 0, // معمولاً در triangular arbitrage برداشت نداریم
      slippage: totalSlippageCost,
      totalCost,
      netProfit: netProfit * steps[0].price, // تبدیل به ارزش دلاری
      netProfitPercentage
    };
  }

  /**
   * محاسبه کارمزد برای market making
   */
  calculateMarketMakingFees(
    exchange: CexInfo,
    pair: string,
    bidPrice: number,
    askPrice: number,
    volume: number
  ): FeeCalculation {
    const spread = askPrice - bidPrice;
    const midPrice = (bidPrice + askPrice) / 2;
    
    // فرض می‌کنیم market maker هستیم، پس از کارمزد maker استفاده می‌کنیم
    const feeStructure = this.getFeeStructure(exchange.id);
    const feeRate = feeStructure.maker / 100;
    
    // محاسبه کارمزد برای خرید و فروش
    const buyTradingFee = volume * bidPrice * feeRate;
    const sellTradingFee = volume * askPrice * feeRate;
    const totalTradingFees = buyTradingFee + sellTradingFee;

    // Slippage کمتر برای market making
    const slippage = this.calculateSlippage(pair, volume, 10000, spread / midPrice);
    const slippageCost = volume * midPrice * (slippage.estimatedSlippage / 100);

    // محاسبه سود
    const grossProfit = volume * spread;
    const totalCost = totalTradingFees + slippageCost;
    const netProfit = grossProfit - totalCost;
    const netProfitPercentage = (netProfit / (volume * midPrice)) * 100;

    return {
      tradingFees: totalTradingFees,
      withdrawalFees: 0,
      slippage: slippageCost,
      totalCost,
      netProfit,
      netProfitPercentage
    };
  }

  /**
   * تخمین قیمت فعلی (شبیه‌سازی)
   */
  private getEstimatedPrice(pair: string): number {
    const prices: { [key: string]: number } = {
      'BTC/USDT': 43250,
      'ETH/USDT': 2580,
      'SOL/USDT': 98.5,
      'XRP/USDT': 0.515,
      'DOGE/USDT': 0.082,
      'ADA/USDT': 0.448,
      'LINK/USDT': 14.75,
      'MATIC/USDT': 0.87,
      'LTC/USDT': 73.2,
      'BCH/USDT': 245
    };
    return prices[pair] || 100;
  }

  /**
   * محاسبه حداقل سود مورد نیاز برای پوشش هزینه‌ها
   */
  calculateMinimumProfitThreshold(
    exchanges: CexInfo[],
    pair: string,
    tradeAmount: number
  ): number {
    const [baseCurrency] = pair.split('/');
    const estimatedPrice = this.getEstimatedPrice(pair);
    
    // تخمین کارمزدهای معاملات
    const tradingFees = this.calculateTradingFees(exchanges, tradeAmount * estimatedPrice, false);
    
    // تخمین کارمزد برداشت (اگر نیاز باشد)
    let withdrawalFees = 0;
    if (exchanges.length > 1) {
      withdrawalFees = this.calculateWithdrawalFees(
        exchanges[0],
        exchanges[1],
        baseCurrency,
        tradeAmount
      );
    }

    // تخمین slippage
    const slippage = this.calculateSlippage(pair, tradeAmount, 5000, 0.001);
    const slippageCost = tradeAmount * estimatedPrice * (slippage.estimatedSlippage / 100);

    // محاسبه حداقل سود مورد نیاز
    const totalCosts = tradingFees + withdrawalFees + slippageCost;
    const minimumProfitPercentage = (totalCosts / (tradeAmount * estimatedPrice)) * 100;

    return minimumProfitPercentage + 0.05; // اضافه کردن 0.05% حاشیه امنیت
  }
}

// نمونه سراسری محاسبه‌گر کارمزد
export const globalFeeCalculator = new FeeCalculator();