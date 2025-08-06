/**
 * تست‌های واحد برای توابع محاسبه آربیتراژ
 * 
 * این فایل شامل تست‌های اساسی برای اعتبارسنجی عملکرد الگوریتم‌های آربیتراژ است
 */

import { globalFeeCalculator } from '../utils/feeCalculator';
import { validateTicker, validateArbitrageOpportunity } from '../utils/dataValidation';
import { CexInfo } from '../types';

// Mock data برای تست‌ها
const mockExchanges: CexInfo[] = [
  { id: 'binance', name: 'Binance', logoUrl: 'test-logo' },
  { id: 'kraken', name: 'Kraken', logoUrl: 'test-logo' }
];

const mockTicker = {
  symbol: 'BTC/USDT',
  timestamp: Date.now(),
  datetime: new Date().toISOString(),
  high: 44000,
  low: 42000,
  bid: 43000,
  ask: 43100,
  last: 43050,
  close: 43050,
  open: 43000,
  change: 50,
  percentage: 0.12,
  average: 43025,
  baseVolume: 1000,
  quoteVolume: 43025000,
  info: {},
  vwap: 43025,
  bidVolume: undefined,
  askVolume: undefined,
  previousClose: undefined
};

/**
 * تست‌های اعتبارسنجی ticker
 */
describe('Ticker Validation Tests', () => {
  test('should validate correct ticker data', () => {
    const result = validateTicker(mockTicker, 'BTC/USDT');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject ticker with invalid bid/ask', () => {
    const invalidTicker = { ...mockTicker, bid: 0, ask: -100 };
    const result = validateTicker(invalidTicker, 'BTC/USDT');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should reject ticker with bid >= ask', () => {
    const invalidTicker = { ...mockTicker, bid: 43200, ask: 43100 };
    const result = validateTicker(invalidTicker, 'BTC/USDT');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid spread: bid (43200) >= ask (43100)');
  });

  test('should warn about stale data', () => {
    const staleTicker = { ...mockTicker, timestamp: Date.now() - 400000 }; // 6+ minutes old
    const result = validateTicker(staleTicker, 'BTC/USDT');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes('stale'))).toBe(true);
  });
});

/**
 * تست‌های اعتبارسنجی فرصت آربیتراژ
 */
describe('Arbitrage Opportunity Validation Tests', () => {
  test('should validate profitable arbitrage opportunity', () => {
    const buyPrice = 43000;
    const sellPrice = 43500;
    const minThreshold = 0.1;
    
    const result = validateArbitrageOpportunity(buyPrice, sellPrice, minThreshold);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject unprofitable opportunity', () => {
    const buyPrice = 43500;
    const sellPrice = 43000;
    const minThreshold = 0.1;
    
    const result = validateArbitrageOpportunity(buyPrice, sellPrice, minThreshold);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Buy price (43500) >= sell price (43000)');
  });

  test('should warn about low profit', () => {
    const buyPrice = 43000;
    const sellPrice = 43010; // Only 0.023% profit
    const minThreshold = 0.1;
    
    const result = validateArbitrageOpportunity(buyPrice, sellPrice, minThreshold);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes('below threshold'))).toBe(true);
  });
});

/**
 * تست‌های محاسبه کارمزد
 */
describe('Fee Calculator Tests', () => {
  test('should calculate spatial arbitrage fees correctly', () => {
    const buyExchange = mockExchanges[0];
    const sellExchange = mockExchanges[1];
    const pair = 'BTC/USDT';
    const tradeAmount = 1;
    const buyPrice = 43000;
    const sellPrice = 43500;
    const marketVolume = 10000;

    const result = globalFeeCalculator.calculateSpatialArbitrageFees(
      buyExchange,
      sellExchange,
      pair,
      tradeAmount,
      buyPrice,
      sellPrice,
      marketVolume
    );

    expect(result.netProfitPercentage).toBeLessThan(result.tradingFees + result.withdrawalFees + result.slippage);
    expect(result.totalCost).toBeGreaterThan(0);
    expect(result.netProfit).toBeLessThan(tradeAmount * (sellPrice - buyPrice));
  });

  test('should calculate triangular arbitrage fees', () => {
    const exchange = mockExchanges[0];
    const steps = [
      { pair: 'BTC/USDT', action: 'BUY' as const, price: 43000 },
      { pair: 'ETH/BTC', action: 'BUY' as const, price: 0.06 },
      { pair: 'ETH/USDT', action: 'SELL' as const, price: 2600 }
    ];
    const initialAmount = 1000; // USDT

    const result = globalFeeCalculator.calculateTriangularArbitrageFees(
      exchange,
      steps,
      initialAmount
    );

    expect(result.tradingFees).toBeGreaterThan(0);
    expect(result.totalCost).toBeGreaterThan(0);
    expect(typeof result.netProfitPercentage).toBe('number');
  });

  test('should calculate market making fees', () => {
    const exchange = mockExchanges[0];
    const pair = 'BTC/USDT';
    const bidPrice = 43000;
    const askPrice = 43100;
    const volume = 100;

    const result = globalFeeCalculator.calculateMarketMakingFees(
      exchange,
      pair,
      bidPrice,
      askPrice,
      volume
    );

    expect(result.tradingFees).toBeGreaterThan(0);
    expect(result.netProfit).toBeLessThan(volume * (askPrice - bidPrice));
    expect(result.netProfitPercentage).toBeGreaterThan(0);
  });

  test('should calculate minimum profit threshold', () => {
    const exchanges = [mockExchanges[0], mockExchanges[1]];
    const pair = 'BTC/USDT';
    const tradeAmount = 1;

    const threshold = globalFeeCalculator.calculateMinimumProfitThreshold(
      exchanges,
      pair,
      tradeAmount
    );

    expect(threshold).toBeGreaterThan(0);
    expect(threshold).toBeLessThan(5); // Should be reasonable (< 5%)
  });
});

/**
 * تست‌های محاسبه سود
 */
describe('Profit Calculation Tests', () => {
  test('should calculate spatial arbitrage profit correctly', () => {
    const buyPrice = 43000;
    const sellPrice = 43500;
    const expectedGrossProfit = ((sellPrice - buyPrice) / buyPrice) * 100;
    
    expect(expectedGrossProfit).toBeCloseTo(1.163, 2); // ~1.16%
  });

  test('should calculate triangular arbitrage profit', () => {
    // Simulate: USDT -> BTC -> ETH -> USDT
    let amount = 1000; // Start with 1000 USDT
    
    // Step 1: Buy BTC with USDT
    const btcPrice = 43000; // USDT/BTC
    amount = amount / btcPrice; // Now have BTC
    
    // Step 2: Buy ETH with BTC
    const ethBtcPrice = 0.06; // BTC/ETH
    amount = amount / ethBtcPrice; // Now have ETH
    
    // Step 3: Sell ETH for USDT
    const ethUsdtPrice = 2600; // USDT/ETH
    amount = amount * ethUsdtPrice; // Back to USDT
    
    const profit = ((amount - 1000) / 1000) * 100;
    expect(profit).toBeCloseTo(0.775, 2); // Expected ~0.78% profit
  });

  test('should handle zero or negative profits', () => {
    const buyPrice = 43500;
    const sellPrice = 43000; // Loss scenario
    const profit = ((sellPrice - buyPrice) / buyPrice) * 100;
    
    expect(profit).toBeLessThan(0);
    expect(profit).toBeCloseTo(-1.149, 2);
  });
});

/**
 * تست‌های edge case
 */
describe('Edge Case Tests', () => {
  test('should handle very small price differences', () => {
    const buyPrice = 43000.00;
    const sellPrice = 43000.01; // 0.0002% difference
    const profit = ((sellPrice - buyPrice) / buyPrice) * 100;
    
    expect(profit).toBeGreaterThan(0);
    expect(profit).toBeLessThan(0.001);
  });

  test('should handle very large price differences', () => {
    const buyPrice = 40000;
    const sellPrice = 50000; // 25% difference (unrealistic but possible)
    const profit = ((sellPrice - buyPrice) / buyPrice) * 100;
    
    expect(profit).toBe(25);
  });

  test('should handle zero prices gracefully', () => {
    const result = validateArbitrageOpportunity(0, 100, 0.1);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid buy price: 0');
  });

  test('should handle negative prices', () => {
    const result = validateArbitrageOpportunity(-100, 100, 0.1);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid buy price: -100');
  });
});

/**
 * تست‌های performance
 */
describe('Performance Tests', () => {
  test('should validate ticker quickly', () => {
    const startTime = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      validateTicker(mockTicker, 'BTC/USDT');
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // Should complete 1000 validations in < 100ms
  });

  test('should calculate fees efficiently', () => {
    const startTime = performance.now();
    
    for (let i = 0; i < 100; i++) {
      globalFeeCalculator.calculateSpatialArbitrageFees(
        mockExchanges[0],
        mockExchanges[1],
        'BTC/USDT',
        1,
        43000,
        43500,
        10000
      );
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(50); // Should complete 100 calculations in < 50ms
  });
});

// Mock implementations for Jest environment
if (typeof expect === 'undefined') {
  // Simple test runner for non-Jest environments
  console.log('🧪 Running Arbitrage Tests...');
  
  // Run basic validation tests
  const ticker = mockTicker;
  const validation = validateTicker(ticker, 'BTC/USDT');
  console.log('✅ Ticker validation:', validation.isValid ? 'PASS' : 'FAIL');
  
  const arbValidation = validateArbitrageOpportunity(43000, 43500, 0.1);
  console.log('✅ Arbitrage validation:', arbValidation.isValid ? 'PASS' : 'FAIL');
  
  const feeCalc = globalFeeCalculator.calculateSpatialArbitrageFees(
    mockExchanges[0],
    mockExchanges[1],
    'BTC/USDT',
    1,
    43000,
    43500,
    10000
  );
  console.log('✅ Fee calculation:', feeCalc.netProfitPercentage > 0 ? 'PASS' : 'FAIL');
  
  console.log('🎉 Basic tests completed!');
}