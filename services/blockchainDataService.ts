import { ArbitrageOpportunity, CexInfo, TriangularArbitrageOpportunity, AnyOpportunity, CrossExchangeTriangularOpportunity, StatisticalArbitrageOpportunity, FlashArbitrageOpportunity } from '../types';
import { SUPPORTED_CEXS, PAIRS_TO_SCAN, MIN_PROFIT_PERCENTAGE_THRESHOLD } from '../constants';

type MockTicker = {
    symbol: string;
    bid: number;
    ask: number;
    last: number;
    timestamp: number;
};

type ExchangeData = {
    cex: CexInfo;
    tickers: { [symbol: string]: MockTicker };
};

// Base prices that will be used to generate realistic variations
const BASE_PRICES: { [pair: string]: number } = {
    'BTC/USDT': 43250,
    'ETH/USDT': 2580,
    'SOL/USDT': 98.5,
    'XRP/USDT': 0.515,
    'DOGE/USDT': 0.082,
    'ADA/USDT': 0.448,
    'LINK/USDT': 14.75,
    'MATIC/USDT': 0.87,
    'LTC/USDT': 73.2,
    'BCH/USDT': 245,
    'BTC/EUR': 39800,
    'ETH/EUR': 2380,
    'ETH/BTC': 0.0596,
    'XRP/BTC': 0.0000119,
    'SOL/BTC': 0.00228,
    'ADA/BTC': 0.0000104,
    'LTC/BTC': 0.00169,
    'MATIC/BTC': 0.0000201,
};

// Generate mock data with realistic price variations and arbitrage opportunities
const generateMockData = (timestamp: number): ExchangeData[] => {
    return SUPPORTED_CEXS.map((cex, exchangeIndex) => {
        const tickers: { [symbol: string]: MockTicker } = {};
        
        PAIRS_TO_SCAN.forEach(pair => {
            if (!BASE_PRICES[pair]) return;
            
            const basePrice = BASE_PRICES[pair];
            
            // Create intentional price differences between exchanges for arbitrage opportunities
            let priceMultiplier = 1;
            
            // Create some profitable opportunities
            if (Math.random() < 0.3) { // 30% chance of arbitrage opportunity
                const variation = 0.002 + Math.random() * 0.008; // 0.2% to 1% variation
                priceMultiplier = exchangeIndex % 2 === 0 ? 1 + variation : 1 - variation;
            } else {
                // Small random variations
                priceMultiplier = 1 + (Math.random() - 0.5) * 0.002; // ±0.1%
            }
            
            const price = basePrice * priceMultiplier;
            const spread = price * (0.0005 + Math.random() * 0.0015); // 0.05% to 0.2% spread
            
            tickers[pair] = {
                symbol: pair,
                bid: price - spread / 2,
                ask: price + spread / 2,
                last: price,
                timestamp,
            };
        });

        return { cex, tickers };
    });
};

// Simulate network delay for realistic experience
const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

const findSpatialOpportunities = (exchangeResults: ExchangeData[], timestamp: number): ArbitrageOpportunity[] => {
    const pricesByPair: { [pair: string]: { cex: CexInfo; bid: number; ask: number }[] } = {};

    for (const { cex, tickers } of exchangeResults) {
        for (const pair in tickers) {
            const ticker = tickers[pair];
            if (ticker && ticker.bid && ticker.ask && ticker.bid > 0 && ticker.ask > 0) {
                if (!pricesByPair[pair]) pricesByPair[pair] = [];
                pricesByPair[pair].push({ cex, bid: ticker.bid, ask: ticker.ask });
            }
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

                if (sellPrice > buyPrice) {
                    const profitPercentage = ((sellPrice - buyPrice) / buyPrice) * 100;
                    if (profitPercentage >= MIN_PROFIT_PERCENTAGE_THRESHOLD) {
                        opportunities.push({
                            type: 'spatial',
                            id: `${pair}-${buyFrom.cex.id}-${sellTo.cex.id}-${timestamp}`,
                            pair,
                            buyAt: { exchange: buyFrom.cex, price: buyPrice },
                            sellAt: { exchange: sellTo.cex, price: sellPrice },
                            profitPercentage,
                            timestamp,
                        });
                    }
                }
            }
        }
    }
    return opportunities;
};

const findTriangularOpportunities = (exchangeResults: ExchangeData[], timestamp: number): TriangularArbitrageOpportunity[] => {
    const opportunities: TriangularArbitrageOpportunity[] = [];

    for (const { cex, tickers } of exchangeResults) {
        const currencies = new Set<string>();
        Object.keys(tickers).forEach(pair => {
            const [base, quote] = pair.split('/');
            currencies.add(base);
            currencies.add(quote);
        });

        const currencyList = Array.from(currencies);
        if (currencyList.length < 3) continue;

        for (let i = 0; i < currencyList.length; i++) {
            for (let j = 0; j < currencyList.length; j++) {
                for (let k = 0; k < currencyList.length; k++) {
                    if (i === j || j === k || i === k) continue;

                    const A = currencyList[i];
                    const B = currencyList[j];
                    const C = currencyList[k];
                    
                    // Path 1: A -> B -> C -> A
                    try {
                        let amount = 1.0;
                        const pair1 = `${B}/${A}`;
                        const pair2 = `${C}/${B}`;
                        const pair3 = `${C}/${A}`;

                        const ticker1 = tickers[pair1];
                        const ticker2 = tickers[pair2];
                        const ticker3_rev = tickers[pair3];
                        
                        if (ticker1 && ticker1.ask && ticker2 && ticker2.ask && ticker3_rev && ticker3_rev.bid) {
                            const rate1 = ticker1.ask; // Buy B with A
                            const rate2 = ticker2.ask; // Buy C with B
                            const rate3 = ticker3_rev.bid; // Sell C for A
                            
                            const amountB = amount / rate1;
                            const amountC = amountB / rate2;
                            const finalAmountA = amountC * rate3;

                            const profit = (finalAmountA - 1.0) * 100;
                            if (profit >= MIN_PROFIT_PERCENTAGE_THRESHOLD) {
                                opportunities.push({
                                    type: 'triangular',
                                    id: `tri-${cex.id}-${A}-${B}-${C}-${timestamp}`,
                                    exchange: cex,
                                    path: [A, B, C],
                                    steps: [
                                        { pair: pair1, action: 'BUY', price: rate1 },
                                        { pair: pair2, action: 'BUY', price: rate2 },
                                        { pair: pair3, action: 'SELL', price: rate3 },
                                    ],
                                    profitPercentage: profit,
                                    timestamp,
                                });
                            }
                        }
                    } catch (e) { /* Path not viable */ }

                    // Path 2: A -> C -> B -> A (Reverse of Path 1)
                     try {
                        let amount = 1.0;
                        const pair1 = `${C}/${A}`;
                        const pair2 = `${B}/${C}`;
                        const pair3 = `${B}/${A}`;

                        const ticker1 = tickers[pair1];
                        const ticker2 = tickers[pair2];
                        const ticker3_rev = tickers[pair3];
                        
                        if (ticker1 && ticker1.ask && ticker2 && ticker2.ask && ticker3_rev && ticker3_rev.bid) {
                            const rate1 = ticker1.ask; // Buy C with A
                            const rate2 = ticker2.ask; // Buy B with C
                            const rate3 = ticker3_rev.bid; // Sell B for A
                            
                            const amountC = amount / rate1;
                            const amountB = amountC / rate2;
                            const finalAmountA = amountB * rate3;

                            const profit = (finalAmountA - 1.0) * 100;
                            if (profit >= MIN_PROFIT_PERCENTAGE_THRESHOLD) {
                                opportunities.push({
                                    type: 'triangular',
                                    id: `tri-${cex.id}-${A}-${C}-${B}-${timestamp}`,
                                    exchange: cex,
                                    path: [A, C, B],
                                    steps: [
                                        { pair: pair1, action: 'BUY', price: rate1 },
                                        { pair: pair2, action: 'BUY', price: rate2 },
                                        { pair: pair3, action: 'SELL', price: rate3 },
                                    ],
                                    profitPercentage: profit,
                                    timestamp,
                                });
                            }
                        }
                    } catch (e) { /* Path not viable */ }
                }
            }
        }
    }
    return opportunities;
};

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

// Statistical Arbitrage based on price correlation
const findStatisticalOpportunities = (exchangeResults: ExchangeData[], timestamp: number): StatisticalArbitrageOpportunity[] => {
    const opportunities: StatisticalArbitrageOpportunity[] = [];
    
    // Calculate price ratios between exchanges for each pair
    const pricesByPair: { [pair: string]: { cex: CexInfo; price: number }[] } = {};
    
    exchangeResults.forEach(({ cex, tickers }) => {
        Object.entries(tickers).forEach(([pair, ticker]) => {
            if (!pricesByPair[pair]) pricesByPair[pair] = [];
            pricesByPair[pair].push({ cex, price: ticker.last });
        });
    });
    
    Object.entries(pricesByPair).forEach(([pair, prices]) => {
        if (prices.length < 2) return;
        
        for (let i = 0; i < prices.length; i++) {
            for (let j = i + 1; j < prices.length; j++) {
                const price1 = prices[i].price;
                const price2 = prices[j].price;
                const ratio = price1 / price2;
                
                // Simulate historical mean and std dev (in real app, this would be calculated from historical data)
                const historicalMean = 1.0; // Assume prices should be equal on average
                const historicalStdDev = 0.005; // 0.5% standard deviation
                
                const zScore = Math.abs(ratio - historicalMean) / historicalStdDev;
                
                if (zScore > 2) { // 2 standard deviations away
                    const expectedReturn = Math.abs(price1 - price2) / Math.min(price1, price2) * 100;
                    const confidence = Math.min(95, 50 + zScore * 10); // Higher z-score = higher confidence
                    
                    if (expectedReturn >= MIN_PROFIT_PERCENTAGE_THRESHOLD) {
                        opportunities.push({
                            type: 'statistical',
                            id: `stat-${pair}-${prices[i].cex.id}-${prices[j].cex.id}-${timestamp}`,
                            pair,
                            exchanges: {
                                primary: prices[i].cex,
                                secondary: prices[j].cex,
                            },
                            prices: {
                                primary: price1,
                                secondary: price2,
                            },
                            zScore,
                            expectedReturn,
                            confidence,
                            timestamp,
                        });
                    }
                }
            }
        }
    });
    
    return opportunities;
};

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
    console.log('Starting arbitrage scan with mock data...');

    // Simulate network delay for realistic experience
    await simulateNetworkDelay();

    // Generate mock data for all exchanges
    const exchangeResults = generateMockData(timestamp);
    
    console.log(`Generated mock data for ${exchangeResults.length} exchanges`);
    
    // Find all types of arbitrage opportunities
    const spatialOps = findSpatialOpportunities(exchangeResults, timestamp);
    const triangularOps = findTriangularOpportunities(exchangeResults, timestamp);
    const crossTriangularOps = findCrossExchangeTriangularOpportunities(exchangeResults, timestamp);
    const statisticalOps = findStatisticalOpportunities(exchangeResults, timestamp);
    const flashOps = findFlashOpportunities(exchangeResults, timestamp);
    
    const allOpportunities: AnyOpportunity[] = [
        ...spatialOps, 
        ...triangularOps, 
        ...crossTriangularOps, 
        ...statisticalOps, 
        ...flashOps
    ];
    
    console.log(`Scan complete. Found ${spatialOps.length} spatial, ${triangularOps.length} triangular, ${crossTriangularOps.length} cross-triangular, ${statisticalOps.length} statistical, and ${flashOps.length} flash opportunities.`);
    
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
    allOpportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
    return allOpportunities;
};
