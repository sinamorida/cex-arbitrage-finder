# 🚀 CEX Arbitrage Finder

A comprehensive tool for identifying arbitrage opportunities across Centralized Cryptocurrency Exchanges

![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)
![Vite](https://img.shields.io/badge/Vite-6.2.0-purple)

## ✨ Features

### 🎯 Core Features
- **Automated arbitrage opportunity detection** across 5 major exchanges
- **7 different arbitrage strategies** with advanced algorithms
- **Modern responsive UI** built with Tailwind CSS
- **Real-time updates** every 15 seconds
- **Advanced filtering and categorization** by strategy type
- **Comprehensive statistics and analysis** of strategy performance
- **Mobile-first design** for access anywhere
- **Browser-compatible** - no Node.js dependencies required

### 🔧 Technical Features
- **Direct exchange API integration** without CCXT dependencies
- **Smart fallback system** - automatically switches to demo data if APIs fail
- **Configurable data source** - toggle between live and simulated data
- **Full TypeScript** for type safety and better development experience
- **Modular architecture** with clean separation of concerns
- **Advanced state management** with React Hooks
- **Performance optimization** with memoization and lazy loading
- **Comprehensive error handling** with retry mechanisms

## 🎲 Arbitrage Strategies

### 1. 🔄 Spatial Arbitrage
**Definition**: Simultaneous buying and selling of an asset on different exchanges with price differences.

**How it works**:
- Compare bid/ask prices of currency pairs across different exchanges
- Identify opportunities where sell price on Exchange A > buy price on Exchange B
- Calculate net profit after fees and slippage

**Example**:
```
BTC/USDT on Binance: $43,250 (buy)
BTC/USDT on Kraken: $43,400 (sell)
Profit: 0.35% = $150 per BTC
```

### 2. 🔺 Triangular Arbitrage
**Definition**: Exploiting exchange rate differences between three currency pairs on a single exchange.

**How it works**:
- Three-step cycle: A → B → C → A
- Identify imbalances in cross-currency rates
- Execute sequential trades to capture profit

**Example**:
```
Path: USDT → BTC → ETH → USDT
1. Buy BTC with USDT
2. Buy ETH with BTC
3. Sell ETH for USDT
Final profit: 0.25%
```

### 3. 🌐 Cross-Exchange Triangular
**Definition**: Combining triangular arbitrage with multiple exchanges to optimize profit.

**How it works**:
- Each step of the triangular cycle executed on the best exchange
- Find optimal buy/sell prices across different exchanges
- Combine benefits of spatial and triangular arbitrage

### 4. 📊 Statistical Arbitrage
**Definition**: Using statistical analysis and mean reversion to identify opportunities.

**How it works**:
- Calculate Z-Score for price deviation from historical mean
- Identify prices more than 2 standard deviations from mean
- Predict price reversion to mean

### 5. ⚡ Flash Arbitrage
**Definition**: Short-term high-profit opportunities requiring rapid execution.

**Features**:
- **Limited time window**: 30 seconds to 5 minutes
- **High profit potential**: Usually above 0.5%
- **Priority levels**: LOW, MEDIUM, HIGH based on profit and risk

### 6. 💰 Market Making Arbitrage
**Definition**: Profiting from bid-ask spreads by acting as a market maker.

**How it works**:
- Identify wide bid-ask spreads on exchanges
- Calculate potential profit from spread capture
- Assess liquidity and volume requirements

### 7. 📈 Pairs Arbitrage
**Definition**: Statistical trading based on correlation between currency pairs.

**How it works**:
- Analyze correlation between related currency pairs
- Identify when pairs deviate from historical relationship
- Execute mean reversion trades

## 🚀 Installation & Setup

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn
- Modern browser with ES6+ support

### Installation Steps

1. **Clone the repository**:
```bash
git clone https://github.com/your-username/cex-arbitrage-finder.git
cd cex-arbitrage-finder
```

2. **Install dependencies**:
```bash
npm install
```

3. **Run development server**:
```bash
npm run dev
```

4. **Access the application**:
```
http://localhost:5173
```

### Production Build

```bash
npm run build
```

## 📖 Usage Guide

### 1. Data Source Configuration
- **Demo Mode**: Simulated market data (default for reliability)
- **Live Mode**: Real-time data from exchange APIs (may have limitations)
- Toggle between modes using the settings panel in the header

### 2. Viewing Opportunities
- Application automatically starts scanning after loading
- Opportunities are sorted by profitability (highest first)
- Each card contains complete strategy information and execution details
- Data refreshes automatically every 15 seconds

### 3. Filtering and Sorting
- Use strategy tabs to filter by arbitrage type
- Sort opportunities by profit, timestamp, or exchange
- Apply custom filters for minimum profit thresholds

### 4. Understanding Opportunity Cards
Each opportunity card displays:
- **Strategy type** with color-coded identification
- **Profit percentage** after fees and slippage
- **Execution steps** with detailed instructions
- **Risk assessment** and confidence indicators
- **Time sensitivity** and expiration information

## 🏗️ Project Structure

```
cex-arbitrage-finder/
├── src/
│   ├── components/            # React components
│   │   ├── ArbitrageCard.tsx           # Spatial arbitrage display
│   │   ├── TriangularArbitrageCard.tsx # Triangular arbitrage display
│   │   ├── CrossTriangularArbitrageCard.tsx # Cross-exchange triangular
│   │   ├── StatisticalArbitrageCard.tsx     # Statistical arbitrage display
│   │   ├── FlashArbitrageCard.tsx      # Flash arbitrage display
│   │   ├── MarketMakingCard.tsx        # Market making arbitrage
│   │   ├── PairsArbitrageCard.tsx      # Pairs arbitrage display
│   │   ├── OpportunityList.tsx         # Main opportunities list
│   │   ├── StrategyStats.tsx           # Strategy statistics dashboard
│   │   └── Header.tsx                  # Application header
│   ├── services/              # Core services
│   │   └── browserExchangeService.ts   # Exchange data service
│   ├── utils/                # Utility functions
│   │   ├── dataValidation.ts          # Data validation and quality
│   │   ├── errorHandler.ts            # Error handling and recovery
│   │   ├── feeCalculator.ts           # Fee and slippage calculations
│   │   └── notificationSystem.ts      # Notification management
│   ├── types.ts              # TypeScript type definitions
│   ├── constants.ts          # Application constants
│   └── App.tsx              # Main application component
├── package.json             # Dependencies and scripts
├── vite.config.ts          # Vite build configuration
└── README.md              # Project documentation
```

## ⚙️ Configuration

### `constants.ts` Configuration

```typescript
// Supported exchanges
export const SUPPORTED_CEXS = [
  { id: 'binance', name: 'Binance' },
  { id: 'kraken', name: 'Kraken' },
  { id: 'coinbase', name: 'Coinbase' },
  { id: 'kucoin', name: 'KuCoin' },
  { id: 'bybit', name: 'Bybit' },
];

// Currency pairs to monitor
export const PAIRS_TO_SCAN = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT',
  'DOGE/USDT', 'ADA/USDT', 'LINK/USDT', 'MATIC/USDT',
  // ...
];

// System parameters
export const REFRESH_INTERVAL_MS = 15000; // 15 seconds
export const MIN_PROFIT_PERCENTAGE_THRESHOLD = 0.1; // 0.1%
```

## 🔌 API & Services

### Core Service: `browserExchangeService.ts`

```typescript
// Main functions
export async function getAllExchangeData(): Promise<ExchangeData[]>
export async function findArbitrageOpportunities(): Promise<AnyOpportunity[]>
export const setUseRealData = (useRealData: boolean) => void

// Usage example
import { findArbitrageOpportunities, setUseRealData } from './services/browserExchangeService';

// Switch to live data mode
setUseRealData(true);

// Fetch opportunities
const opportunities = await findArbitrageOpportunities();
console.log(`Found ${opportunities.length} arbitrage opportunities`);
```

## 🧮 Algorithm Example

### Spatial Arbitrage Algorithm

```typescript
function findSpatialOpportunities(exchanges: ExchangeData[], timestamp: number): ArbitrageOpportunity[] {
  const opportunities = [];
  
  for (const pair of PAIRS_TO_SCAN) {
    const prices = exchanges
      .map(ex => ({ exchange: ex.cex, bid: ex.tickers[pair]?.bid, ask: ex.tickers[pair]?.ask }))
      .filter(p => p.bid && p.ask);
    
    for (let i = 0; i < prices.length; i++) {
      for (let j = 0; j < prices.length; j++) {
        if (i === j) continue;
        
        const buyPrice = prices[i].ask;
        const sellPrice = prices[j].bid;
        
        if (sellPrice > buyPrice) {
          const profit = ((sellPrice - buyPrice) / buyPrice) * 100;
          if (profit >= MIN_PROFIT_THRESHOLD) {
            opportunities.push({
              type: 'spatial',
              pair,
              buyAt: { exchange: prices[i].exchange, price: buyPrice },
              sellAt: { exchange: prices[j].exchange, price: sellPrice },
              profitPercentage: profit
            });
          }
        }
      }
    }
  }
  
  return opportunities;
}
```

## ⚡ Performance Optimization

### React Optimizations

```typescript
// Memoized components for expensive renders
const MemoizedArbitrageCard = React.memo(ArbitrageCard);

// Optimized hooks
const useDebounced = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

## 🔒 Security & Best Practices

### Data Security
- **No sensitive data storage**: No API keys or personal information stored
- **Input validation**: All inputs are validated and sanitized
- **CORS handling**: Proper CORS configuration for API calls
- **Error boundaries**: React error boundaries prevent crashes

### Code Quality
- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code quality and consistency enforcement
- **Error handling**: Comprehensive error handling with user-friendly messages
- **Performance monitoring**: Built-in performance tracking

## 📊 Real-World Example

### Spatial Arbitrage Case Study

```
Date: 2025-01-08 14:30:00 UTC
Pair: BTC/USDT

Exchange A (Binance):
  - Ask Price: $43,280.50
  - Volume: 15.7 BTC
  - Fee: 0.1%

Exchange B (Kraken):
  - Bid Price: $43,420.80
  - Volume: 12.3 BTC
  - Fee: 0.16%

Calculation:
  - Gross Profit: 0.324%
  - Trading Fees: 0.26%
  - Net Profit: 0.064%
  - Profit per BTC: $27.70
```

## 🚨 Important Warnings

### Risk Factors
⚠️ **Educational Purpose Only**: This tool is for learning and research
⚠️ **No Financial Advice**: Not intended as trading advice
⚠️ **Market Volatility**: Cryptocurrency markets are highly volatile
⚠️ **Execution Risk**: Prices can change during trade execution

### Technical Limitations
- **CORS Issues**: Browser security may block some API calls
- **Rate Limits**: Exchange APIs have request limitations
- **Market Depth**: Order book depth not fully considered
- **Network Latency**: Real-world execution delays not accounted for

## 📈 Future Roadmap

### Planned Features
- [ ] WebSocket integration for real-time data
- [ ] Advanced analytics and backtesting
- [ ] Additional exchange integrations
- [ ] Mobile app development
- [ ] API access for developers

## 📞 Support

### Getting Help
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community questions and feedback

### FAQ

**Q: Can I use this for actual trading?**
A: This tool is for educational purposes only and should not be used as the sole basis for trading decisions.

**Q: How accurate are the profit calculations?**
A: Calculations are estimates that include basic fees but may not account for all real-world costs.

**Q: Why use demo mode?**
A: Demo mode provides consistent, reliable data for learning without API limitations.

## 📄 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 CEX Arbitrage Finder

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

*Last updated: January 2025*

**⭐ Star this repository if you find it useful!**