// Browser-compatible exchange data service without Node.js dependencies
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

type ExchangeData = {
    cex: CexInfo;
    tickers: { [symbol: string]: BrowserTicker };
};

// Configuration for fallback mode
let USE_FALLBACK_DATA = true; // Set to true to use demo data by default

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
        const tickers: { [symbol: string]: BrowserTicker } = {};
        
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

// Browser-compatible exchange API endpoints using Vite proxy
const EXCHANGE_ENDPOINTS = {
    binance: {
        ticker: '/api/binance/api/v3/ticker/24hr',
        symbols: '/api/binance/api/v3/exchangeInfo'
    },
    coinbase: {
        ticker: '/api/coinbase/products',
        symbols: '/api/coinbase/products'
    },
    kraken: {
        ticker: '/api/kraken/0/public/Ticker',
        symbols: '/api/kraken/0/public/AssetPairs'
    },
    // For exchanges without proxy, we'll use fallback data
    bybit: {
        ticker: null,
        symbols: null
    },
    kucoin: {
        ticker: null,
        symbols: null
    }
};

// Convert exchange-specific data to our standard format
function normalizeTickerData(rawData: any, exchange: string, symbol: string): BrowserTicker | null {
    const timestamp = Date.now();
    
    try {
        switch (exchange) {
            case 'binance':
                return {
                    symbol,
                    timestamp,
                    datetime: new Date(timestamp).toISOString(),
                    high: parseFloat(rawData.highPrice),
                    low: parseFloat(rawData.lowPrice),
                    bid: parseFloat(rawData.bidPrice),
                    ask: parseFloat(rawData.askPrice),
                    last: parseFloat(rawData.lastPrice),
                    close: parseFloat(rawData.lastPrice),
                    open: parseFloat(rawData.openPrice),
                    change: parseFloat(rawData.priceChange),
                    percentage: parseFloat(rawData.priceChangePercent),
                    baseVolume: parseFloat(rawData.volume),
                    quoteVolume: parseFloat(rawData.quoteVolume),
                    info: rawData
                };
                
            case 'coinbase':
                return {
                    symbol,
                    timestamp,
                    datetime: new Date(timestamp).toISOString(),
                    bid: parseFloat(rawData.bid),
                    ask: parseFloat(rawData.ask),
                    last: parseFloat(rawData.price),
                    close: parseFloat(rawData.price),
                    baseVolume: parseFloat(rawData.volume),
                    percentage: parseFloat(rawData.price_change_24h),
                    info: rawData
                };
                
            case 'kraken':
                const tickerData = rawData[Object.keys(rawData)[0]];
                return {
                    symbol,
                    timestamp,
                    datetime: new Date(timestamp).toISOString(),
                    high: parseFloat(tickerData.h[1]),
                    low: parseFloat(tickerData.l[1]),
                    bid: parseFloat(tickerData.b[0]),
                    ask: parseFloat(tickerData.a[0]),
                    last: parseFloat(tickerData.c[0]),
                    close: parseFloat(tickerData.c[0]),
                    open: parseFloat(tickerData.o),
                    baseVolume: parseFloat(tickerData.v[1]),
                    info: rawData
                };
                
            default:
                return null;
        }
    } catch (error) {
        console.error(`Failed to normalize ticker data for ${exchange}:`, error);
        return null;
    }
}

// Fetch real market data from exchanges using browser-compatible APIs
async function fetchExchangeData(cex: CexInfo): Promise<ExchangeData> {
    const startTime = Date.now();
    
    try {
        console.log(`📡 Fetching data from ${cex.name} using browser APIs...`);
        
        const endpoint = EXCHANGE_ENDPOINTS[cex.id as keyof typeof EXCHANGE_ENDPOINTS];
        if (!endpoint) {
            throw new Error(`No browser API endpoint configured for ${cex.name}`);
        }

        // Use fetch with proper CORS handling
        const response = await globalRetryHandler.executeWithRetry(
            () => globalRetryHandler.executeWithTimeout(
                () => fetch(endpoint.ticker, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors', // Enable CORS
                }),
                30000, // 30 second timeout
                cex.id
            ),
            cex.id,
            { maxRetries: 2, baseDelay: 2000 }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData = await response.json();
        const tickers: { [symbol: string]: BrowserTicker } = {};

        // Process the response based on exchange format
        if (cex.id === 'binance' && Array.isArray(rawData)) {
            rawData.forEach((item: any) => {
                const symbol = item.symbol.replace(/USDT$/, '/USDT').replace(/BTC$/, '/BTC').replace(/ETH$/, '/ETH');
                if (PAIRS_TO_SCAN.includes(symbol)) {
                    const ticker = normalizeTickerData(item, cex.id, symbol);
                    if (ticker) {
                        tickers[symbol] = ticker;
                    }
                }
            });
        }

        // Validate and filter tickers using the new validation system
        const validTickers = filterValidTickers(tickers, PAIRS_TO_SCAN);
        const dataQuality = calculateDataQuality(validTickers, PAIRS_TO_SCAN);
        
        // Log data quality metrics
        console.log(`📊 ${cex.name} Data Quality:`, {
            completeness: `${dataQuality.completeness}%`,
            freshness: `${dataQuality.freshness}%`,
            accuracy: `${dataQuality.accuracy}%`,
            consistency: `${dataQuality.consistency}%`,
            validTickers: Object.keys(validTickers).length,
            totalFetched: Object.keys(tickers).length
        });

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

// Main function to get all exchange data
export async function getAllExchangeData(): Promise<ExchangeData[]> {
    const timestamp = Date.now();
    
    if (USE_FALLBACK_DATA) {
        console.log('🎭 Using fallback/demo data mode');
        return generateFallbackData(timestamp);
    }

    console.log('🌐 Fetching real exchange data...');
    
    // Fetch data from all exchanges in parallel
    const exchangePromises = SUPPORTED_CEXS.map(cex => fetchExchangeData(cex));
    const results = await Promise.allSettled(exchangePromises);
    
    const exchangeData: ExchangeData[] = [];
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            exchangeData.push(result.value);
        } else {
            console.error(`Failed to fetch data from ${SUPPORTED_CEXS[index].name}:`, result.reason);
            // Add empty data for failed exchanges
            exchangeData.push({ cex: SUPPORTED_CEXS[index], tickers: {} });
        }
    });

    return exchangeData;
}

// Spatial arbitrage opportunities
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

// Main function to find all arbitrage opportunities
export async function findArbitrageOpportunities(): Promise<AnyOpportunity[]> {
    try {
        const timestamp = Date.now();
        const exchangeData = await getAllExchangeData();
        
        console.log('🔍 Starting arbitrage opportunity detection...');
        
        const allOpportunities: AnyOpportunity[] = [];
        
        // Find spatial arbitrage opportunities
        const spatialOpportunities = findSpatialOpportunities(exchangeData, timestamp);
        allOpportunities.push(...spatialOpportunities);
        
        console.log(`✅ Found ${allOpportunities.length} total arbitrage opportunities`);
        
        return allOpportunities;
        
    } catch (error) {
        const searchError = error instanceof Error ? error : new Error(String(error));
        globalErrorHandler.handleCalculationError(searchError, {
            type: 'opportunity_search',
            step: 'main_search'
        });
        
        console.error('❌ Failed to find arbitrage opportunities:', searchError.message);
        return [];
    }
}