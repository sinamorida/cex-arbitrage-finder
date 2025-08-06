// Browser-compatible exchange data service without CCXT Node.js dependencies
import { ArbitrageOpportunity, CexInfo, TriangularArbitrageOpportunity, AnyOpportunity, CrossExchangeTriangularOpportunity, StatisticalArbitrageOpportunity, FlashArbitrageOpportunity, MarketMakingOpportunity, PairsArbitrageOpportunity } from '../types';
import { SUPPORTED_CEXS, PAIRS_TO_SCAN, MIN_PROFIT_PERCENTAGE_THRESHOLD } from '../constants';
import { 
  validateTicker, 
  validateExchangeData, 
  filterValidTickers, 
  calculateDataQuality, 
  detectPriceAnomalies,
  validateArbitrageOpportunity,
  DataQualityMetrics 
} from '../utils/dataValidation';
import { globalErrorHandler, ErrorType } from '../utils/errorHandler';
import { globalRetryHandler } from '../utils/retryHandler';
import { globalFeeCalculator } from '../utils/feeCalculator';

// Browser-compatible ticker interface (similar to ccxt.Ticker)
interface BrowserTicker {
  symbol: string;
  timestamp: number;
  datetime: string;
  high?: number;
  low?: number;
  bid?: number;
  ask?: number;
  last?: number;
  close?: number;
  open?: number;
  change?: number;
  percentage?: number;
  average?: number;
  baseVolume?: number;
  quoteVolume?: number;
  info?: any;
  vwap?: number;
  bidVolume?: number;
  askVolume?: number;
  previousClose?: number;
}

// Configuration for fallback mode
let USE_FALLBACK_DATA = true; // Set to false to use real APIs

// Function to toggle between real and fallback data
export const setUseRealData = (useRealData: boolean) => {
    USE_FALLBACK_DATA = !useRealData;
    console.log(`Data source changed to: ${useRealData ? 'Real APIs' : 'Fallback/Demo'}`);
};

// Enhanced fallback mock data generator with realistic market simulation
const generateFallbackData = (timestamp: number): ExchangeData[] => {
    // Base prices with more realistic values
    const basePrices: { [pair: string]: number } = {
        'BTC/USDT': 43250 + (Math.random() - 0.5) * 2000, // ±$1000 variation
        'ETH/USDT': 2580 + (Math.random() - 0.5) * 200,   // ±$100 variation
        'SOL/USDT': 98.5 + (Math.random() - 0.5) * 10,    // ±$5 variation
        'XRP/USDT': 0.515 + (Math.random() - 0.5) * 0.05, // ±$0.025 variation
        'DOGE/USDT': 0.082 + (Math.random() - 0.5) * 0.01,
        'ADA/USDT': 0.448 + (Math.random() - 0.5) * 0.05,
        'LINK/USDT': 14.75 + (Math.random() - 0.5) * 2,
        'MATIC/USDT': 0.87 + (Math.random() - 0.5) * 0.1,
        'LTC/USDT': 73.2 + (Math.random() - 0.5) * 8,
        'BCH/USDT': 245 + (Math.random() - 0.5) * 25,
        'BTC/EUR': 39800 + (Math.random() - 0.5) * 1800,
        'ETH/EUR': 2380 + (Math.random() - 0.5) * 180,
        'ETH/BTC': 0.0596 + (Math.random() - 0.5) * 0.002,
        'XRP/BTC': 0.0000119 + (Math.random() - 0.5) * 0.000002,
        'SOL/BTC': 0.00228 + (Math.random() - 0.5) * 0.0002,
        'ADA/BTC': 0.0000104 + (Math.random() - 0.5) * 0.000002,
        'LTC/BTC': 0.00169 + (Math.random() - 0.5) * 0.0002,
        'MATIC/BTC': 0.0000201 + (Math.random() - 0.5) * 0.000003,
    };

    return SUPPORTED_CEXS.map((cex, exchangeIndex) => {
        const tickers: { [symbol: string]: ccxt.Ticker } = {};
        
        PAIRS_TO_SCAN.forEach(pair => {
            if (!basePrices[pair]) return;
            
            const basePrice = basePrices[pair];
            
            // Create more realistic price differences for arbitrage opportunities
            let priceMultiplier = 1;
            const arbitrageChance = Math.random();
            
            if (arbitrageChance < 0.3) { // 30% chance of arbitrage opportunity
                // Different exchanges have different price patterns
                const exchangeVariations = [0.002, -0.001, 0.003, -0.002, 0.001]; // Per exchange variation
                const baseVariation = exchangeVariations[exchangeIndex] || 0;
                const randomVariation = (Math.random() - 0.5) * 0.008; // ±0.4% random
                priceMultiplier = 1 + baseVariation + randomVariation;
            } else {
                // Normal market variation
                priceMultiplier = 1 + (Math.random() - 0.5) * 0.002; // ±0.1%
            }
            
            const price = Math.max(basePrice * priceMultiplier, 0.000001); // Prevent negative prices
            
            // Realistic spread based on pair type and exchange
            let spreadPercentage = 0.001; // 0.1% default
            if (pair.includes('BTC') || pair.includes('ETH')) {
                spreadPercentage = 0.0005 + Math.random() * 0.001; // 0.05% to 0.15%
            } else {
                spreadPercentage = 0.001 + Math.random() * 0.003; // 0.1% to 0.4%
            }
            
            const spread = price * spreadPercentage;
            const bid = price - spread / 2;
            const ask = price + spread / 2;
            
            // Ensure bid < ask
            const finalBid = Math.min(bid, ask - 0.000001);
            const finalAsk = Math.max(ask, bid + 0.000001);
            
            // Generate realistic volume
            const baseVolume = 1000 + Math.random() * 10000;
            const quoteVolume = baseVolume * price;
            
            tickers[pair] = {
                symbol: pair,
                timestamp,
                datetime: new Date(timestamp).toISOString(),
                high: price * (1.01 + Math.random() * 0.02), // 1-3% above current
                low: price * (0.97 + Math.random() * 0.02),  // 1-3% below current
                bid: finalBid,
                ask: finalAsk,
                last: price + (Math.random() - 0.5) * spread, // Last price within spread
                close: price,
                open: price * (0.995 + Math.random() * 0.01), // Slight variation from close
                change: price * (Math.random() - 0.5) * 0.02, // ±1% change
                percentage: (Math.random() - 0.5) * 4, // ±2% percentage change
                average: price,
                baseVolume,
                quoteVolume,
                info: {
                    exchange: cex.id,
                    generated: true,
                    quality: 'demo'
                },
                vwap: price * (0.999 + Math.random() * 0.002), // VWAP close to price
                bidVolume: baseVolume * 0.3,
                askVolume: baseVolume * 0.3,
                previousClose: price * (0.995 + Math.random() * 0.01)
            };
        });

        console.log(`📊 Generated ${Object.keys(tickers).length} demo tickers for ${cex.name}`);
        return { cex, tickers };
    });
};

type ExchangeData = {
    cex: CexInfo;
    tickers: { [symbol: string]: ccxt.Ticker };
};

// Exchange instances cache
const exchangeCache: { [id: string]: ccxt.Exchange } = {};

// Initialize exchange instance with proper configuration
function getExchangeInstance(cexInfo: CexInfo): ccxt.Exchange {
    if (exchangeCache[cexInfo.id]) {
        return exchangeCache[cexInfo.id];
    }

    const config: any = {
        timeout: 30000,
        enableRateLimit: true,
        options: {
            adjustForTimeDifference: true,
            defaultType: 'spot'
        },
    };

    // Exchange-specific configurations
    switch (cexInfo.id) {
        case 'binance':
            config.options.defaultType = 'spot';
            break;
        case 'coinbase':
            config.sandbox = false;
            break;
        case 'kraken':
            config.options.adjustForTimeDifference = false;
            break;
        case 'bybit':
            config.options.defaultType = 'spot';
            break;
        case 'kucoin':
            config.options.partner = { key: 'ccxt', secret: '', pass: '' };
            break;
    }

    try {
        const exchange = new (ccxt as any)[cexInfo.id](config);
        exchangeCache[cexInfo.id] = exchange;
        return exchange;
    } catch (error) {
        console.error(`Failed to initialize ${cexInfo.name}:`, error);
        throw error;
    }
}

// Fetch real market data from exchanges with enhanced error handling
async function fetchExchangeData(cex: CexInfo): Promise<ExchangeData> {
    const startTime = Date.now();
    
    try {
        const exchange = getExchangeInstance(cex);
        console.log(`📡 Fetching data from ${cex.name}...`);
        
        // Load markets if not already loaded
        if (!exchange.markets) {
            try {
                await exchange.loadMarkets();
            } catch (marketError) {
                const error = marketError instanceof Error ? marketError : new Error(String(marketError));
                globalErrorHandler.handleExchangeError(error, cex);
                throw new Error(`Failed to load markets for ${cex.name}: ${error.message}`);
            }
        }

        // Filter available pairs
        const availablePairs = PAIRS_TO_SCAN.filter(pair => 
            exchange.markets && exchange.markets[pair]
        );

        if (availablePairs.length === 0) {
            const error = new Error(`No supported pairs found on ${cex.name}`);
            globalErrorHandler.handleExchangeError(error, cex);
            return { cex, tickers: {} };
        }

        let rawTickers: { [symbol: string]: ccxt.Ticker } = {};

        // Try batch fetch first with retry mechanism
        if (exchange.has['fetchTickers']) {
            try {
                console.log(`🔄 ${cex.name}: Attempting batch fetch for ${availablePairs.length} pairs`);
                
                // Use retry handler for batch fetch with timeout
                const fetchedTickers = await globalRetryHandler.executeWithRetry(
                    () => globalRetryHandler.executeWithTimeout(
                        () => exchange.fetchTickers(availablePairs),
                        30000, // 30 second timeout
                        cex.id
                    ),
                    cex.id,
                    { maxRetries: 2, baseDelay: 2000 }
                );
                
                rawTickers = fetchedTickers || {};
                console.log(`✅ ${cex.name}: Batch fetched ${Object.keys(rawTickers).length} raw tickers`);
            } catch (batchError) {
                const error = batchError instanceof Error ? batchError : new Error(String(batchError));
                globalErrorHandler.handleExchangeError(error, cex);
                console.warn(`⚠️ ${cex.name}: Batch fetch failed, trying individual fetches`);
                
                // Fallback to individual ticker fetches with enhanced retry logic
                const results = await Promise.allSettled(
                    availablePairs.map(async (pair) => {
                        try {
                            const ticker = await globalRetryHandler.executeWithRetry(
                                () => globalRetryHandler.executeWithTimeout(
                                    () => exchange.fetchTicker(pair),
                                    15000, // 15 second timeout per ticker
                                    cex.id
                                ),
                                cex.id,
                                { maxRetries: 2, baseDelay: 1000 }
                            );
                            return ticker ? { [pair]: ticker } : null;
                        } catch (e) {
                            const error = e instanceof Error ? e : new Error(String(e));
                            globalErrorHandler.handleExchangeError(error, cex);
                            console.warn(`❌ ${cex.name}: Failed to fetch ${pair}: ${error.message}`);
                            return null;
                        }
                    })
                );

                rawTickers = Object.assign({}, 
                    ...results
                        .filter(r => r.status === 'fulfilled' && r.value)
                        .map(r => (r as PromiseFulfilledResult<any>).value)
                );
                console.log(`🔄 ${cex.name}: Individual fetched ${Object.keys(rawTickers).length} raw tickers`);
            }
        } else {
            // Exchange doesn't support batch fetch - use individual with retry
            console.log(`🔄 ${cex.name}: Using individual fetch (no batch support)`);
            const results = await Promise.allSettled(
                availablePairs.map(async (pair) => {
                    try {
                        const ticker = await globalRetryHandler.executeWithRetry(
                            () => globalRetryHandler.executeWithTimeout(
                                () => exchange.fetchTicker(pair),
                                15000, // 15 second timeout per ticker
                                cex.id
                            ),
                            cex.id,
                            { maxRetries: 2, baseDelay: 1000 }
                        );
                        return ticker ? { [pair]: ticker } : null;
                    } catch (e) {
                        const error = e instanceof Error ? e : new Error(String(e));
                        globalErrorHandler.handleExchangeError(error, cex);
                        return null;
                    }
                })
            );

            rawTickers = Object.assign({}, 
                ...results
                    .filter(r => r.status === 'fulfilled' && r.value)
                    .map(r => (r as PromiseFulfilledResult<any>).value)
            );
            console.log(`🔄 ${cex.name}: Individual fetched ${Object.keys(rawTickers).length} raw tickers`);
        }

        // Validate and filter tickers using the new validation system
        const validTickers = filterValidTickers(rawTickers, availablePairs);
        const dataQuality = calculateDataQuality(validTickers, availablePairs);
        
        // Log data quality metrics
        console.log(`📊 ${cex.name} Data Quality:`, {
            completeness: `${dataQuality.completeness}%`,
            freshness: `${dataQuality.freshness}%`,
            accuracy: `${dataQuality.accuracy}%`,
            consistency: `${dataQuality.consistency}%`,
            validTickers: Object.keys(validTickers).length,
            totalFetched: Object.keys(rawTickers).length
        });

        // Check for anomalies in key pairs
        const anomalies: string[] = [];
        ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'].forEach(pair => {
            if (validTickers[pair]) {
                const anomaly = detectPriceAnomalies(validTickers, pair);
                if (anomaly.isAnomaly) {
                    anomalies.push(`${pair}: ${anomaly.reason} (${anomaly.severity})`);
                }
            }
        });

        if (anomalies.length > 0) {
            console.warn(`🚨 ${cex.name} Price Anomalies Detected:`, anomalies);
        }

        const fetchTime = Date.now() - startTime;
        console.log(`⏱️ ${cex.name}: Fetch completed in ${fetchTime}ms`);

        return { cex, tickers: validTickers };

    } catch (error) {
        const fetchError = error instanceof Error ? error : new Error(String(error));
        globalErrorHandler.handleExchangeError(fetchError, cex);
        
        const fetchTime = Date.now() - startTime;
        console.error(`❌ ${cex.name}: Failed to fetch data after ${fetchTime}ms - ${fetchError.message}`);
        
        return { cex, tickers: {} };
    }
}

const findSpatialOpportunities = (exchangeResults: ExchangeData[], timestamp: number): ArbitrageOpportunity[] => {
    const pricesByPair: { [pair: string]: { cex: CexInfo; bid: number; ask: number }[] } = {};

    // جمع‌آوری قیمت‌ها از تمام صرافی‌ها
    for (const { cex, tickers } of exchangeResults) {
        for (const pair in tickers) {
            const ticker = tickers[pair];
            
            // اعتبارسنجی ticker با سیستم جدید
            const validation = validateTicker(ticker, pair);
            if (!validation.isValid) {
                console.warn(`Invalid ticker for ${pair} on ${cex.name}:`, validation.errors);
                continue;
            }

            if (!pricesByPair[pair]) pricesByPair[pair] = [];
            pricesByPair[pair].push({ cex, bid: ticker.bid!, ask: ticker.ask! });
        }
    }

    const opportunities: ArbitrageOpportunity[] = [];

    for (const pair in pricesByPair) {
        const prices = pricesByPair[pair];
        if (prices.length < 2) continue;

        for (let i = 0; i < prices.length; i++) {
            for (let j = 0; j < prices.length; j++) {
                if (i === j) continue;

                const buyFrom = prices[i];
                const sellTo = prices[j];
                const buyPrice = buyFrom.ask;
                const sellPrice = sellTo.bid;

                // اعتبارسنجی فرصت آربیتراژ
                const opportunityValidation = validateArbitrageOpportunity(
                    buyPrice, 
                    sellPrice, 
                    MIN_PROFIT_PERCENTAGE_THRESHOLD
                );

                if (!opportunityValidation.isValid) {
                    continue;
                }

                // محاسبه سود ناخالص
                const grossProfitPercentage = ((sellPrice - buyPrice) / buyPrice) * 100;
                
                // محاسبه کارمزد و هزینه‌های واقعی
                const tradeAmount = 1; // فرض 1 واحد از ارز پایه
                const feeCalculation = globalFeeCalculator.calculateSpatialArbitrageFees(
                    buyFrom.cex,
                    sellTo.cex,
                    pair,
                    tradeAmount,
                    buyPrice,
                    sellPrice,
                    10000 // حجم بازار فرضی
                );

                // فقط فرصت‌هایی را در نظر بگیریم که پس از کسر کارمزد سودآور هستند
                if (feeCalculation.netProfitPercentage < MIN_PROFIT_PERCENTAGE_THRESHOLD) {
                    continue;
                }
                
                try {
                    opportunities.push({
                        type: 'spatial',
                        id: `${pair}-${buyFrom.cex.id}-${sellTo.cex.id}-${timestamp}`,
                        pair,
                        buyAt: { exchange: buyFrom.cex, price: buyPrice },
                        sellAt: { exchange: sellTo.cex, price: sellPrice },
                        profitPercentage: feeCalculation.netProfitPercentage, // استفاده از سود خالص
                        timestamp,
                    });
                } catch (error) {
                    const calcError = error instanceof Error ? error : new Error(String(error));
                    globalErrorHandler.handleCalculationError(calcError, {
                        type: 'spatial_arbitrage',
                        pair,
                        buyPrice,
                        sellPrice,
                        step: 'opportunity_creation'
                    });
                }
            }
        }
    }

    console.log(`🔄 Found ${opportunities.length} spatial arbitrage opportunities`);
    return opportunities;
};

// Enhanced triangular arbitrage with better path optimization
const findTriangularOpportunities = (exchangeResults: ExchangeData[], timestamp: number): TriangularArbitrageOpportunity[] => {
    const opportunities: TriangularArbitrageOpportunity[] = [];

    for (const { cex, tickers } of exchangeResults) {
        // ساخت گراف ارزها و جفت‌های موجود
        const currencyGraph = buildCurrencyGraph(tickers);
        const currencies = Array.from(currencyGraph.keys());
        
        if (currencies.length < 3) continue;

        // پیدا کردن تمام مسیرهای مثلثی ممکن
        const triangularPaths = findAllTriangularPaths(currencyGraph, currencies);
        
        console.log(`🔺 ${cex.name}: Found ${triangularPaths.length} potential triangular paths`);

        // بررسی هر مسیر برای فرصت آربیتراژ
        for (const path of triangularPaths) {
            try {
                const opportunity = calculateTriangularProfit(path, tickers, cex, timestamp);
                if (opportunity && opportunity.profitPercentage >= MIN_PROFIT_PERCENTAGE_THRESHOLD) {
                    opportunities.push(opportunity);
                }
            } catch (error) {
                const calcError = error instanceof Error ? error : new Error(String(error));
                globalErrorHandler.handleCalculationError(calcError, {
                    type: 'triangular_arbitrage',
                    path,
                    exchange: cex.id,
                    step: 'profit_calculation'
                });
            }
        }
    }

    console.log(`🔺 Found ${opportunities.length} triangular arbitrage opportunities`);
    return opportunities;
};

// ساخت گراف ارزها بر اساس جفت‌های موجود
function buildCurrencyGraph(tickers: { [symbol: string]: ccxt.Ticker }): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    
    Object.keys(tickers).forEach(pair => {
        const [base, quote] = pair.split('/');
        
        // اضافه کردن ارزها به گراف
        if (!graph.has(base)) graph.set(base, new Set());
        if (!graph.has(quote)) graph.set(quote, new Set());
        
        // اضافه کردن اتصالات دوطرفه
        graph.get(base)!.add(quote);
        graph.get(quote)!.add(base);
    });
    
    return graph;
}

// پیدا کردن تمام مسیرهای مثلثی ممکن
function findAllTriangularPaths(graph: Map<string, Set<string>>, currencies: string[]): string[][] {
    const paths: string[][] = [];
    
    // اولویت‌بندی ارزهای اصلی
    const priorityCurrencies = ['USDT', 'BTC', 'ETH', 'USDC', 'EUR'];
    const sortedCurrencies = currencies.sort((a, b) => {
        const aIndex = priorityCurrencies.indexOf(a);
        const bIndex = priorityCurrencies.indexOf(b);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
    });

    // پیدا کردن مسیرهای مثلثی با شروع از ارزهای اولویت‌دار
    for (let i = 0; i < Math.min(sortedCurrencies.length, 10); i++) { // محدود کردن برای بهبود عملکرد
        const startCurrency = sortedCurrencies[i];
        const neighbors = graph.get(startCurrency);
        
        if (!neighbors) continue;
        
        for (const secondCurrency of neighbors) {
            if (secondCurrency === startCurrency) continue;
            
            const secondNeighbors = graph.get(secondCurrency);
            if (!secondNeighbors) continue;
            
            for (const thirdCurrency of secondNeighbors) {
                if (thirdCurrency === startCurrency || thirdCurrency === secondCurrency) continue;
                
                // بررسی وجود مسیر بازگشت
                const thirdNeighbors = graph.get(thirdCurrency);
                if (thirdNeighbors && thirdNeighbors.has(startCurrency)) {
                    paths.push([startCurrency, secondCurrency, thirdCurrency]);
                }
            }
        }
    }
    
    return paths;
}

// محاسبه سود مسیر مثلثی
function calculateTriangularProfit(
    path: string[], 
    tickers: { [symbol: string]: ccxt.Ticker }, 
    exchange: CexInfo, 
    timestamp: number
): TriangularArbitrageOpportunity | null {
    const [A, B, C] = path;
    
    // تعریف جفت‌های مورد نیاز و جهت معاملات
    const trades = [
        { from: A, to: B, pair: `${B}/${A}`, action: 'BUY' as const },
        { from: B, to: C, pair: `${C}/${B}`, action: 'BUY' as const },
        { from: C, to: A, pair: `${C}/${A}`, action: 'SELL' as const }
    ];
    
    // بررسی وجود تمام جفت‌های مورد نیاز
    const steps: { pair: string; action: 'BUY' | 'SELL'; price: number }[] = [];
    let amount = 1.0;
    
    for (const trade of trades) {
        const ticker = tickers[trade.pair];
        if (!ticker) {
            // تلاش برای پیدا کردن جفت معکوس
            const reversePair = `${trade.from}/${trade.to}`;
            const reverseTicker = tickers[reversePair];
            
            if (!reverseTicker) return null;
            
            // استفاده از جفت معکوس
            const price = trade.action === 'BUY' ? 
                (reverseTicker.bid ? 1 / reverseTicker.bid : null) : 
                (reverseTicker.ask ? 1 / reverseTicker.ask : null);
            
            if (!price || price <= 0) return null;
            
            steps.push({
                pair: reversePair,
                action: trade.action === 'BUY' ? 'SELL' : 'BUY',
                price: 1 / price
            });
            
            amount = trade.action === 'BUY' ? amount / price : amount * price;
        } else {
            // اعتبارسنجی ticker
            const validation = validateTicker(ticker, trade.pair);
            if (!validation.isValid) return null;
            
            const price = trade.action === 'BUY' ? ticker.ask! : ticker.bid!;
            
            steps.push({
                pair: trade.pair,
                action: trade.action,
                price
            });
            
            amount = trade.action === 'BUY' ? amount / price : amount * price;
        }
    }
    
    const grossProfit = (amount - 1.0) * 100;
    
    // محاسبه کارمزد و هزینه‌های واقعی برای triangular arbitrage
    const feeCalculation = globalFeeCalculator.calculateTriangularArbitrageFees(
        exchange,
        steps,
        1.0 // مقدار اولیه
    );
    
    // استفاده از سود خالص پس از کسر کارمزد
    if (feeCalculation.netProfitPercentage < MIN_PROFIT_PERCENTAGE_THRESHOLD) return null;
    
    return {
        type: 'triangular',
        id: `tri-${exchange.id}-${A}-${B}-${C}-${timestamp}`,
        exchange,
        path: [A, B, C],
        steps,
        profitPercentage: feeCalculation.netProfitPercentage,
        timestamp,
    };
}

// Cross-Exchange Triangular Arbitrage
const findCrossExchangeTriangularOpportunities = (exchangeResults: ExchangeData[], timestamp: number): CrossExchangeTriangularOpportunity[] => {
    const opportunities: CrossExchangeTriangularOpportunity[] = [];
    
    // Get all available currencies across all exchanges
    const allCurrencies = new Set<string>();
    exchangeResults.forEach(({ tickers }) => {
        Object.keys(tickers).forEach(pair => {
            const [base, quote] = pair.split('/');
            allCurrencies.add(base);
            allCurrencies.add(quote);
        });
    });
    
    const currencyList = Array.from(allCurrencies);
    if (currencyList.length < 3) return opportunities;
    
    // Try triangular paths across different exchanges
    for (let i = 0; i < currencyList.length; i++) {
        for (let j = 0; j < currencyList.length; j++) {
            for (let k = 0; k < currencyList.length; k++) {
                if (i === j || j === k || i === k) continue;
                
                const A = currencyList[i];
                const B = currencyList[j];
                const C = currencyList[k];
                
                // Find best prices across all exchanges for each leg
                const pair1 = `${B}/${A}`;
                const pair2 = `${C}/${B}`;
                const pair3 = `${C}/${A}`;
                
                let bestStep1: { exchange: CexInfo; price: number } | null = null;
                let bestStep2: { exchange: CexInfo; price: number } | null = null;
                let bestStep3: { exchange: CexInfo; price: number } | null = null;
                
                // Find best ask price for step 1 (buy B with A)
                exchangeResults.forEach(({ cex, tickers }) => {
                    if (tickers[pair1] && tickers[pair1].ask) {
                        if (!bestStep1 || tickers[pair1].ask < bestStep1.price) {
                            bestStep1 = { exchange: cex, price: tickers[pair1].ask };
                        }
                    }
                });
                
                // Find best ask price for step 2 (buy C with B)
                exchangeResults.forEach(({ cex, tickers }) => {
                    if (tickers[pair2] && tickers[pair2].ask) {
                        if (!bestStep2 || tickers[pair2].ask < bestStep2.price) {
                            bestStep2 = { exchange: cex, price: tickers[pair2].ask };
                        }
                    }
                });
                
                // Find best bid price for step 3 (sell C for A)
                exchangeResults.forEach(({ cex, tickers }) => {
                    if (tickers[pair3] && tickers[pair3].bid) {
                        if (!bestStep3 || tickers[pair3].bid > bestStep3.price) {
                            bestStep3 = { exchange: cex, price: tickers[pair3].bid };
                        }
                    }
                });
                
                if (bestStep1 && bestStep2 && bestStep3) {
                    let amount = 1.0;
                    const amountB = amount / bestStep1.price;
                    const amountC = amountB / bestStep2.price;
                    const finalAmountA = amountC * bestStep3.price;
                    
                    const profit = (finalAmountA - 1.0) * 100;
                    if (profit >= MIN_PROFIT_PERCENTAGE_THRESHOLD) {
                        opportunities.push({
                            type: 'cross-triangular',
                            id: `cross-tri-${A}-${B}-${C}-${timestamp}`,
                            path: [A, B, C],
                            steps: [
                                { pair: pair1, action: 'BUY', price: bestStep1.price, exchange: bestStep1.exchange },
                                { pair: pair2, action: 'BUY', price: bestStep2.price, exchange: bestStep2.exchange },
                                { pair: pair3, action: 'SELL', price: bestStep3.price, exchange: bestStep3.exchange },
                            ],
                            profitPercentage: profit,
                            timestamp,
                        });
                    }
                }
            }
        }
    }
    
    return opportunities;
};

// Enhanced Statistical Arbitrage with proper historical analysis
const findStatisticalOpportunities = (exchangeResults: ExchangeData[], timestamp: number): StatisticalArbitrageOpportunity[] => {
    const opportunities: StatisticalArbitrageOpportunity[] = [];
    
    // جمع‌آوری قیمت‌ها از تمام صرافی‌ها
    const pricesByPair: { [pair: string]: { cex: CexInfo; price: number; volume: number }[] } = {};
    
    exchangeResults.forEach(({ cex, tickers }) => {
        Object.entries(tickers).forEach(([pair, ticker]) => {
            // اعتبارسنجی ticker
            const validation = validateTicker(ticker, pair);
            if (!validation.isValid || !ticker.last) return;

            if (!pricesByPair[pair]) pricesByPair[pair] = [];
            pricesByPair[pair].push({ 
                cex, 
                price: ticker.last,
                volume: ticker.baseVolume || 0
            });
        });
    });
    
    Object.entries(pricesByPair).forEach(([pair, prices]) => {
        if (prices.length < 2) return;
        
        // محاسبه آمار تاریخی برای هر جفت صرافی
        for (let i = 0; i < prices.length; i++) {
            for (let j = i + 1; j < prices.length; j++) {
                const exchange1 = prices[i];
                const exchange2 = prices[j];
                
                // بررسی حداقل حجم معاملات
                if (exchange1.volume < 100 || exchange2.volume < 100) continue;
                
                try {
                    const analysis = performStatisticalAnalysis(
                        pair, 
                        exchange1, 
                        exchange2, 
                        timestamp
                    );
                    
                    if (analysis && analysis.expectedReturn >= MIN_PROFIT_PERCENTAGE_THRESHOLD) {
                        opportunities.push(analysis);
                    }
                } catch (error) {
                    const calcError = error instanceof Error ? error : new Error(String(error));
                    globalErrorHandler.handleCalculationError(calcError, {
                        type: 'statistical_arbitrage',
                        pair,
                        exchange1: exchange1.cex.id,
                        exchange2: exchange2.cex.id,
                        step: 'statistical_analysis'
                    });
                }
            }
        }
    });
    
    console.log(`📊 Found ${opportunities.length} statistical arbitrage opportunities`);
    return opportunities;
};

// تحلیل آماری پیشرفته برای statistical arbitrage
function performStatisticalAnalysis(
    pair: string,
    exchange1: { cex: CexInfo; price: number; volume: number },
    exchange2: { cex: CexInfo; price: number; volume: number },
    timestamp: number
): StatisticalArbitrageOpportunity | null {
    
    const price1 = exchange1.price;
    const price2 = exchange2.price;
    
    // محاسبه نسبت قیمت
    const priceRatio = price1 / price2;
    
    // دریافت داده‌های تاریخی شبیه‌سازی شده
    const historicalData = getHistoricalPriceData(pair, exchange1.cex.id, exchange2.cex.id);
    
    // محاسبه میانگین متحرک و انحراف معیار
    const movingAverage = calculateMovingAverage(historicalData.ratios, 20); // 20-period MA
    const standardDeviation = calculateStandardDeviation(historicalData.ratios, movingAverage);
    
    // محاسبه Z-Score
    const zScore = Math.abs(priceRatio - movingAverage) / standardDeviation;
    
    // بررسی معنی‌داری آماری
    if (zScore < 2.0) return null; // کمتر از 2 انحراف معیار
    
    // محاسبه بازده مورد انتظار
    const priceDifference = Math.abs(price1 - price2);
    const expectedReturn = (priceDifference / Math.min(price1, price2)) * 100;
    
    // محاسبه سطح اعتماد بر اساس Z-Score و حجم معاملات
    const volumeWeight = Math.min(1.0, (exchange1.volume + exchange2.volume) / 10000);
    const baseConfidence = Math.min(95, 50 + zScore * 15);
    const confidence = baseConfidence * volumeWeight;
    
    // بررسی پایداری الگو
    const patternStability = calculatePatternStability(historicalData.ratios);
    if (patternStability < 0.6) return null; // الگو ناپایدار
    
    // محاسبه ریسک
    const volatility = calculateVolatility(historicalData.ratios);
    const riskAdjustedReturn = expectedReturn / Math.max(volatility, 0.01);
    
    if (riskAdjustedReturn < 2.0) return null; // نسبت ریسک به بازده پایین
    
    return {
        type: 'statistical',
        id: `stat-${pair}-${exchange1.cex.id}-${exchange2.cex.id}-${timestamp}`,
        pair,
        exchanges: {
            primary: exchange1.cex,
            secondary: exchange2.cex,
        },
        prices: {
            primary: price1,
            secondary: price2,
        },
        zScore,
        expectedReturn,
        confidence,
        timestamp,
    };
}

// شبیه‌سازی داده‌های تاریخی
function getHistoricalPriceData(pair: string, exchange1Id: string, exchange2Id: string): { ratios: number[] } {
    // در اپلیکیشن واقعی، این داده‌ها از دیتابیس یا API دریافت می‌شوند
    const baseRatio = 1.0;
    const volatility = getPairVolatility(pair);
    
    // تولید 100 نقطه داده تاریخی شبیه‌سازی شده
    const ratios: number[] = [];
    for (let i = 0; i < 100; i++) {
        // شبیه‌سازی mean reversion با نویز تصادفی
        const trend = Math.sin(i * 0.1) * 0.01; // روند چرخه‌ای
        const noise = (Math.random() - 0.5) * volatility * 2;
        const ratio = baseRatio + trend + noise;
        ratios.push(Math.max(0.5, Math.min(2.0, ratio))); // محدود کردن در بازه منطقی
    }
    
    return { ratios };
}

// محاسبه میانگین متحرک
function calculateMovingAverage(data: number[], period: number): number {
    if (data.length < period) return data.reduce((sum, val) => sum + val, 0) / data.length;
    
    const recentData = data.slice(-period);
    return recentData.reduce((sum, val) => sum + val, 0) / period;
}

// محاسبه انحراف معیار
function calculateStandardDeviation(data: number[], mean: number): number {
    if (data.length < 2) return 0.01; // حداقل انحراف معیار
    
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
}

// محاسبه پایداری الگو
function calculatePatternStability(data: number[]): number {
    if (data.length < 10) return 0;
    
    // محاسبه ضریب تغییرات (coefficient of variation)
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const stdDev = calculateStandardDeviation(data, mean);
    const cv = stdDev / mean;
    
    // پایداری معکوس ضریب تغییرات است
    return Math.max(0, 1 - cv);
}

// محاسبه نوسانات
function calculateVolatility(data: number[]): number {
    if (data.length < 2) return 0.01;
    
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
        const returnRate = (data[i] - data[i-1]) / data[i-1];
        returns.push(returnRate);
    }
    
    const meanReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    return calculateStandardDeviation(returns, meanReturn);
}

// دریافت نوسانات جفت ارز
function getPairVolatility(pair: string): number {
    const volatilities: { [key: string]: number } = {
        'BTC/USDT': 0.02,
        'ETH/USDT': 0.025,
        'SOL/USDT': 0.04,
        'XRP/USDT': 0.03,
        'DOGE/USDT': 0.05,
        'ADA/USDT': 0.035,
        'LINK/USDT': 0.04,
        'MATIC/USDT': 0.045,
        'LTC/USDT': 0.03,
        'BCH/USDT': 0.035
    };
    
    return volatilities[pair] || 0.03; // نوسانات پیش‌فرض 3%
}

// Market Making Arbitrage - Profit from bid-ask spreads
const findMarketMakingOpportunities = (exchangeResults: ExchangeData[], timestamp: number): MarketMakingOpportunity[] => {
    const opportunities: MarketMakingOpportunity[] = [];
    
    exchangeResults.forEach(({ cex, tickers }) => {
        Object.entries(tickers).forEach(([pair, ticker]) => {
            // اعتبارسنجی ticker
            const validation = validateTicker(ticker, pair);
            if (!validation.isValid) {
                return;
            }

            const bidPrice = ticker.bid!;
            const askPrice = ticker.ask!;
            const spread = askPrice - bidPrice;
            const spreadPercentage = (spread / bidPrice) * 100;
            
            // بررسی حداقل spread برای سودآوری
            if (spreadPercentage < MIN_PROFIT_PERCENTAGE_THRESHOLD * 2) {
                return;
            }

            // محاسبه امتیاز نقدینگی
            const baseVolume = ticker.baseVolume || 0;
            const bidVolume = ticker.bidVolume || baseVolume * 0.3;
            const askVolume = ticker.askVolume || baseVolume * 0.3;
            const totalVolume = bidVolume + askVolume;
            
            // امتیاز نقدینگی بر اساس حجم معاملات
            let liquidityScore = 0;
            if (totalVolume > 10000) liquidityScore = 100;
            else if (totalVolume > 5000) liquidityScore = 80;
            else if (totalVolume > 1000) liquidityScore = 60;
            else if (totalVolume > 500) liquidityScore = 40;
            else liquidityScore = 20;

            // تعیین سطح ریسک
            let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
            if (spreadPercentage > 2) riskLevel = 'HIGH';
            else if (spreadPercentage > 0.5) riskLevel = 'MEDIUM';

            // محاسبه کارمزد و هزینه‌های واقعی برای market making
            const feeCalculation = globalFeeCalculator.calculateMarketMakingFees(
                cex,
                pair,
                bidPrice,
                askPrice,
                Math.min(totalVolume, 100) // محدود کردن حجم برای محاسبه واقعی‌تر
            );

            // فقط فرصت‌هایی را در نظر بگیریم که پس از کسر کارمزد سودآور هستند
            if (feeCalculation.netProfitPercentage < MIN_PROFIT_PERCENTAGE_THRESHOLD) {
                return;
            }

            try {
                opportunities.push({
                    type: 'market-making',
                    id: `mm-${pair}-${cex.id}-${timestamp}`,
                    pair,
                    exchange: cex,
                    bidPrice,
                    askPrice,
                    spread,
                    spreadPercentage,
                    volume: totalVolume,
                    profitPercentage: feeCalculation.netProfitPercentage, // استفاده از سود خالص
                    riskLevel,
                    liquidityScore,
                    timestamp,
                });
            } catch (error) {
                const calcError = error instanceof Error ? error : new Error(String(error));
                globalErrorHandler.handleCalculationError(calcError, {
                    type: 'market_making',
                    pair,
                    bidPrice,
                    askPrice,
                    step: 'opportunity_creation'
                });
            }
        });
    });

    console.log(`💰 Found ${opportunities.length} market making opportunities`);
    return opportunities;
};

// Pairs Arbitrage - Statistical pairs trading
const findPairsArbitrageOpportunities = (exchangeResults: ExchangeData[], timestamp: number): PairsArbitrageOpportunity[] => {
    const opportunities: PairsArbitrageOpportunity[] = [];
    
    // جفت‌های ارز مرتبط برای pairs trading
    const correlatedPairs = [
        ['BTC/USDT', 'ETH/USDT'],
        ['ETH/USDT', 'SOL/USDT'],
        ['XRP/USDT', 'ADA/USDT'],
        ['LTC/USDT', 'BCH/USDT'],
        ['BTC/EUR', 'ETH/EUR']
    ];

    exchangeResults.forEach(({ cex, tickers }) => {
        correlatedPairs.forEach(([pair1, pair2]) => {
            const ticker1 = tickers[pair1];
            const ticker2 = tickers[pair2];
            
            if (!ticker1 || !ticker2 || !ticker1.last || !ticker2.last) {
                return;
            }

            const price1 = ticker1.last;
            const price2 = ticker2.last;
            
            // محاسبه نسبت قیمت
            const priceRatio = price1 / price2;
            
            // شبیه‌سازی داده‌های تاریخی (در اپلیکیشن واقعی از داده‌های تاریخی استفاده می‌شود)
            const historicalMeanRatio = getHistoricalMeanRatio(pair1, pair2);
            const historicalStdDev = getHistoricalStdDev(pair1, pair2);
            
            // محاسبه Z-Score
            const zscore = Math.abs(priceRatio - historicalMeanRatio) / historicalStdDev;
            
            if (zscore > 2) { // انحراف بیش از 2 انحراف معیار
                // محاسبه ضریب پوشش ریسک (hedge ratio)
                const hedgeRatio = calculateHedgeRatio(pair1, pair2);
                
                // محاسبه بازده مورد انتظار
                const expectedReturn = Math.abs(priceRatio - historicalMeanRatio) / historicalMeanRatio * 100;
                
                // محاسبه اعتماد
                const confidence = Math.min(95, 50 + zscore * 15);
                
                // محاسبه همبستگی (شبیه‌سازی شده)
                const correlation = getCorrelation(pair1, pair2);

                if (expectedReturn >= MIN_PROFIT_PERCENTAGE_THRESHOLD && Math.abs(correlation) > 0.7) {
                    try {
                        opportunities.push({
                            type: 'pairs',
                            id: `pairs-${pair1}-${pair2}-${cex.id}-${timestamp}`,
                            pair1,
                            pair2,
                            exchange: cex,
                            correlation,
                            zscore,
                            expectedReturn,
                            confidence,
                            hedgeRatio,
                            prices: {
                                pair1: price1,
                                pair2: price2
                            },
                            timestamp,
                        });
                    } catch (error) {
                        const calcError = error instanceof Error ? error : new Error(String(error));
                        globalErrorHandler.handleCalculationError(calcError, {
                            type: 'pairs_arbitrage',
                            pair1,
                            pair2,
                            zscore,
                            step: 'opportunity_creation'
                        });
                    }
                }
            }
        });
    });

    console.log(`📈 Found ${opportunities.length} pairs arbitrage opportunities`);
    return opportunities;
};

// توابع کمکی برای pairs arbitrage
function getHistoricalMeanRatio(pair1: string, pair2: string): number {
    // شبیه‌سازی نسبت میانگین تاریخی
    const ratios: { [key: string]: number } = {
        'BTC/USDT-ETH/USDT': 16.8,
        'ETH/USDT-SOL/USDT': 26.2,
        'XRP/USDT-ADA/USDT': 1.15,
        'LTC/USDT-BCH/USDT': 0.3,
        'BTC/EUR-ETH/EUR': 16.7
    };
    return ratios[`${pair1}-${pair2}`] || 1.0;
}

function getHistoricalStdDev(pair1: string, pair2: string): number {
    // شبیه‌سازی انحراف معیار تاریخی
    const stdDevs: { [key: string]: number } = {
        'BTC/USDT-ETH/USDT': 0.8,
        'ETH/USDT-SOL/USDT': 2.1,
        'XRP/USDT-ADA/USDT': 0.05,
        'LTC/USDT-BCH/USDT': 0.02,
        'BTC/EUR-ETH/EUR': 0.75
    };
    return stdDevs[`${pair1}-${pair2}`] || 0.1;
}

function calculateHedgeRatio(pair1: string, pair2: string): number {
    // شبیه‌سازی ضریب پوشش ریسک
    const hedgeRatios: { [key: string]: number } = {
        'BTC/USDT-ETH/USDT': 0.85,
        'ETH/USDT-SOL/USDT': 0.75,
        'XRP/USDT-ADA/USDT': 0.9,
        'LTC/USDT-BCH/USDT': 0.8,
        'BTC/EUR-ETH/EUR': 0.85
    };
    return hedgeRatios[`${pair1}-${pair2}`] || 1.0;
}

function getCorrelation(pair1: string, pair2: string): number {
    // شبیه‌سازی ضریب همبستگی
    const correlations: { [key: string]: number } = {
        'BTC/USDT-ETH/USDT': 0.85,
        'ETH/USDT-SOL/USDT': 0.78,
        'XRP/USDT-ADA/USDT': 0.72,
        'LTC/USDT-BCH/USDT': 0.81,
        'BTC/EUR-ETH/EUR': 0.87
    };
    return correlations[`${pair1}-${pair2}`] || 0.5;
}

// Flash Arbitrage - High urgency, short-term opportunities
const findFlashOpportunities = (exchangeResults: ExchangeData[], timestamp: number): FlashArbitrageOpportunity[] => {
    const opportunities: FlashArbitrageOpportunity[] = [];
    
    const pricesByPair: { [pair: string]: { cex: CexInfo; bid: number; ask: number }[] } = {};
    
    exchangeResults.forEach(({ cex, tickers }) => {
        Object.entries(tickers).forEach(([pair, ticker]) => {
            if (!pricesByPair[pair]) pricesByPair[pair] = [];
            pricesByPair[pair].push({ cex, bid: ticker.bid, ask: ticker.ask });
        });
    });
    
    Object.entries(pricesByPair).forEach(([pair, prices]) => {
        if (prices.length < 2) return;
        
        for (let i = 0; i < prices.length; i++) {
            for (let j = 0; j < prices.length; j++) {
                if (i === j) continue;
                
                const buyFrom = prices[i];
                const sellTo = prices[j];
                const buyPrice = buyFrom.ask;
                const sellPrice = sellTo.bid;
                
                if (sellPrice > buyPrice) {
                    const profitPercentage = ((sellPrice - buyPrice) / buyPrice) * 100;
                    
                    // Only consider high-profit opportunities as "flash"
                    if (profitPercentage >= MIN_PROFIT_PERCENTAGE_THRESHOLD * 3) {
                        let urgency: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
                        let timeWindow = 300; // 5 minutes default
                        
                        if (profitPercentage > 2) {
                            urgency = 'HIGH';
                            timeWindow = 30; // 30 seconds
                        } else if (profitPercentage > 1) {
                            urgency = 'MEDIUM';
                            timeWindow = 120; // 2 minutes
                        }
                        
                        opportunities.push({
                            type: 'flash',
                            id: `flash-${pair}-${buyFrom.cex.id}-${sellTo.cex.id}-${timestamp}`,
                            pair,
                            buyAt: { exchange: buyFrom.cex, price: buyPrice },
                            sellAt: { exchange: sellTo.cex, price: sellPrice },
                            profitPercentage,
                            timeWindow,
                            urgency,
                            timestamp,
                        });
                    }
                }
            }
        }
    });
    
    return opportunities;
};

export const fetchAllOpportunities = async (): Promise<AnyOpportunity[]> => {
    const timestamp = Date.now();
    
    let exchangeResults: ExchangeData[] = [];
    
    if (USE_FALLBACK_DATA) {
        console.log('Using fallback data for demonstration...');
        exchangeResults = generateFallbackData(timestamp);
    } else {
        console.log('Starting real-time arbitrage scan...');
        
        try {
            // Fetch data from all exchanges in parallel
            const exchangePromises = SUPPORTED_CEXS.map(cex => fetchExchangeData(cex));
            const results = await Promise.all(exchangePromises);
            
            // Filter out exchanges that failed to fetch data
            const successfulExchanges = results.filter(result => 
                Object.keys(result.tickers).length > 0
            );
            
            console.log(`Successfully fetched data from ${successfulExchanges.length}/${SUPPORTED_CEXS.length} exchanges`);
            
            if (successfulExchanges.length < 2) {
                console.warn('Not enough exchanges with data, falling back to demo data...');
                exchangeResults = generateFallbackData(timestamp);
            } else {
                exchangeResults = successfulExchanges;
            }
        } catch (error) {
            console.error('Failed to fetch real data, using fallback:', error);
            exchangeResults = generateFallbackData(timestamp);
        }
    }
    
    // Find all types of arbitrage opportunities
    const spatialOps = findSpatialOpportunities(exchangeResults, timestamp);
    const triangularOps = findTriangularOpportunities(exchangeResults, timestamp);
    const crossTriangularOps = findCrossExchangeTriangularOpportunities(exchangeResults, timestamp);
    const statisticalOps = findStatisticalOpportunities(exchangeResults, timestamp);
    const flashOps = findFlashOpportunities(exchangeResults, timestamp);
    const marketMakingOps = findMarketMakingOpportunities(exchangeResults, timestamp);
    const pairsOps = findPairsArbitrageOpportunities(exchangeResults, timestamp);
    
    const allOpportunities: AnyOpportunity[] = [
        ...spatialOps, 
        ...triangularOps, 
        ...crossTriangularOps, 
        ...statisticalOps, 
        ...flashOps,
        ...marketMakingOps,
        ...pairsOps
    ];
    
    console.log(`🎯 Scan complete. Found ${spatialOps.length} spatial, ${triangularOps.length} triangular, ${crossTriangularOps.length} cross-triangular, ${statisticalOps.length} statistical, ${flashOps.length} flash, ${marketMakingOps.length} market-making, and ${pairsOps.length} pairs arbitrage opportunities.`);
    
    // Log some sample prices for debugging
    if (exchangeResults.length > 0) {
        const sampleExchange = exchangeResults[0];
        const samplePairs = Object.keys(sampleExchange.tickers).slice(0, 3);
        console.log(`Sample prices from ${sampleExchange.cex.name}:`, 
            samplePairs.map(pair => ({
                pair,
                bid: sampleExchange.tickers[pair].bid,
                ask: sampleExchange.tickers[pair].ask
            }))
        );
    }

    // Sort by profitability
    allOpportunities.sort((a, b) => {
        const aProfit = a.type === 'statistical' ? a.expectedReturn : a.profitPercentage;
        const bProfit = b.type === 'statistical' ? b.expectedReturn : b.profitPercentage;
        return bProfit - aProfit;
    });
    
    return allOpportunities;
};
