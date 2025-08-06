export interface CexInfo {
  id: string; // ccxt id (e.g., 'binance')
  name: string;
  logoUrl: string;
}

// Spatial Arbitrage: Buy on CEX A, Sell on CEX B
export interface ArbitrageOpportunity {
  type: 'spatial';
  id: string; // e.g., 'BTC/USDT-binance-kraken'
  pair: string; // e.g., 'BTC/USDT'
  buyAt: {
    exchange: CexInfo;
    price: number;
  };
  sellAt: {
    exchange: CexInfo;
    price: number;
  };
  profitPercentage: number;
  timestamp: number;
}

// Triangular Arbitrage: A -> B -> C -> A on a single CEX
export interface TriangularArbitrageOpportunity {
  type: 'triangular';
  id: string; // e.g., 'binance-USDT-BTC-ETH'
  exchange: CexInfo;
  path: [string, string, string]; // e.g., ['USDT', 'BTC', 'ETH']
  steps: {
    pair: string;
    action: 'BUY' | 'SELL';
    price: number;
  }[];
  profitPercentage: number;
  timestamp: number;
}

// Cross-Exchange Triangular Arbitrage: Different legs on different exchanges
export interface CrossExchangeTriangularOpportunity {
  type: 'cross-triangular';
  id: string;
  path: [string, string, string]; // e.g., ['USDT', 'BTC', 'ETH']
  steps: {
    pair: string;
    action: 'BUY' | 'SELL';
    price: number;
    exchange: CexInfo;
  }[];
  profitPercentage: number;
  timestamp: number;
}

// Statistical Arbitrage: Based on price correlation and mean reversion
export interface StatisticalArbitrageOpportunity {
  type: 'statistical';
  id: string;
  pair: string;
  exchanges: {
    primary: CexInfo;
    secondary: CexInfo;
  };
  prices: {
    primary: number;
    secondary: number;
  };
  zScore: number; // How many standard deviations away from mean
  expectedReturn: number;
  confidence: number; // 0-100%
  timestamp: number;
}

// Flash Arbitrage: Very short-term opportunities
export interface FlashArbitrageOpportunity {
  type: 'flash';
  id: string;
  pair: string;
  buyAt: {
    exchange: CexInfo;
    price: number;
  };
  sellAt: {
    exchange: CexInfo;
    price: number;
  };
  profitPercentage: number;
  timeWindow: number; // seconds
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
}

// Market Making Arbitrage: Profit from bid-ask spreads
export interface MarketMakingOpportunity {
  type: 'market-making';
  id: string;
  pair: string;
  exchange: CexInfo;
  bidPrice: number;
  askPrice: number;
  spread: number;
  spreadPercentage: number;
  volume: number;
  profitPercentage: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  liquidityScore: number; // 0-100
  timestamp: number;
}

// Pairs Arbitrage: Statistical pairs trading
export interface PairsArbitrageOpportunity {
  type: 'pairs';
  id: string;
  pair1: string;
  pair2: string;
  exchange: CexInfo;
  correlation: number;
  zscore: number;
  expectedReturn: number;
  confidence: number;
  hedgeRatio: number;
  prices: {
    pair1: number;
    pair2: number;
  };
  timestamp: number;
}

export type AnyOpportunity = ArbitrageOpportunity | TriangularArbitrageOpportunity | CrossExchangeTriangularOpportunity | StatisticalArbitrageOpportunity | FlashArbitrageOpportunity | MarketMakingOpportunity | PairsArbitrageOpportunity;


export enum DataStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
