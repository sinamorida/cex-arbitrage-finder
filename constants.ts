import { CexInfo } from './types';

// CEX CONFIGURATIONS
// Focus on most reliable exchanges for better success rate
export const SUPPORTED_CEXS: CexInfo[] = [
  { id: 'binance', name: 'Binance', logoUrl: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png' },
  { id: 'kraken', name: 'Kraken', logoUrl: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/24.png' },
  { id: 'coinbase', name: 'Coinbase', logoUrl: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/89.png' },
  { id: 'kucoin', name: 'KuCoin', logoUrl: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/311.png' },
  { id: 'bybit', name: 'Bybit', logoUrl: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/525.png' },
];

// PAIRS TO SCAN
// Use common pairs that are likely to be listed on all exchanges.
// Added cross-pairs for triangular arbitrage
export const PAIRS_TO_SCAN: string[] = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'XRP/USDT',
  'DOGE/USDT',
  'ADA/USDT',
  'LINK/USDT',
  'MATIC/USDT',
  'LTC/USDT',
  'BCH/USDT',
  'BTC/EUR',
  'ETH/EUR',
  'ETH/BTC',
  'XRP/BTC',
  'SOL/BTC',
  'ADA/BTC',
  'LTC/BTC',
  'MATIC/BTC',
];

// ARBITRAGE SCANNING PARAMETERS
export const REFRESH_INTERVAL_MS = 30000; // 30 seconds to respect rate limits
export const MIN_PROFIT_PERCENTAGE_THRESHOLD = 0.05; // 0.05% minimum for real opportunities