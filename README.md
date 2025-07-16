# 🚀 CEX Arbitrage Finder

A comprehensive and advanced tool for identifying arbitrage opportunities across Centralized Exchanges (CEX) using React and TypeScript.

![CEX Arbitrage Finder](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)
![Vite](https://img.shields.io/badge/Vite-6.2.0-purple)

## 📋 Table of Contents

- [Features](#features)
- [Arbitrage Strategies](#arbitrage-strategies)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API & Services](#api--services)
- [Components](#components)
- [Arbitrage Algorithms](#arbitrage-algorithms)
- [Performance Optimization](#performance-optimization)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🎯 Core Features
- **Automated arbitrage opportunity detection** across 5 major exchanges
- **5 different arbitrage strategies** with advanced algorithms
- **Modern responsive UI** built with Tailwind CSS
- **Live updates** every 15 seconds
- **Filter and categorization** of opportunities by strategy type
- **Comprehensive statistics and analysis** of strategy performance
- **Mobile-first design** for access anywhere

### 🔧 Technical Features
- **Real-time API integration** with CCXT library for live exchange data
- **Smart fallback system** - automatically switches to demo data if APIs fail
- **Configurable data source** - toggle between live and simulated data
- **Full TypeScript** for type safety
- **Modular architecture** and extensible design
- **Advanced state management** with React Hooks
- **Performance optimization** with lazy loading and memoization

## 🎲 Arbitrage Strategies

### 1. 🔄 Spatial Arbitrage
**Definition**: Simultaneous buying and selling of an asset on different exchanges with different prices.

**How it works**:
- Compare bid/ask prices of a currency pair across different exchanges
- Identify opportunities where sell price on Exchange A > buy price on Exchange B
- Calculate net profit after fees

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

**Example**:
```
Step 1: Buy BTC on Binance (best price)
Step 2: Buy ETH on KuCoin (best price)
Step 3: Sell ETH on Kraken (best price)
```

### 4. 📊 Statistical Arbitrage
**Definition**: Using statistical analysis and mean reversion to identify opportunities.

**How it works**:
- Calculate Z-Score for price deviation from historical mean
- Identify prices more than 2 standard deviations from mean
- Predict price reversion to mean

**Metrics**:
- **Z-Score**: Deviation from mean
- **Confidence**: Prediction confidence percentage
- **Expected Return**: Anticipated return

### 5. ⚡ Flash Arbitrage
**Definition**: Short-term high-profit opportunities requiring rapid execution.

**Features**:
- **Limited time window**: 30 seconds to 5 minutes
- **High profit**: Usually above 0.5%
- **Priority levels**: LOW, MEDIUM, HIGH
- **Instant alerts**: For rapid execution

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
# or
yarn install
```

3. **Run development server**:
```bash
npm run dev
# or
yarn dev
```

4. **Access the application**:
```
http://localhost:5173
```

### Production Build

```bash
npm run build
# or
yarn build
```

Built files will be placed in the `dist` folder.

## 📖 Usage Guide

### 1. Data Source Configuration
- **Settings Panel**: Click the gear icon in the header to access settings
- **Toggle Data Source**: Switch between "Live Data" and "Demo Mode"
- **Live Data**: Real-time market data from exchange APIs (may have limitations)
- **Demo Mode**: Simulated data that always works (default)

### 2. Viewing Opportunities
- After loading, the app automatically starts scanning
- Opportunities are sorted by profitability
- Each card contains complete strategy information
- Data refreshes every 30 seconds (live mode) or 15 seconds (demo mode)

### 3. Filtering Strategies
- Use tabs at the top to filter by strategy type
- View statistics for each strategy
- Compare performance of different strategies

### 4. Analyzing Statistics
- **Total Opportunities**: Total number of identified opportunities
- **Average Profit**: Average profitability of all opportunities
- **Best Opportunity**: Highest achievable profit
- **Active Strategies**: Number of strategies with opportunities

### 5. Understanding Opportunity Cards
Each card includes:
- **Strategy type** with unique color coding
- **Profit percentage** achievable
- **Execution details** (exchanges, prices, steps)
- **Discovery timestamp**

### 6. Data Source Indicator
- **Green dot (Live Data)**: Real-time data from exchanges
- **Yellow dot (Demo Mode)**: Simulated data for demonstration

## 🏗️ Project Structure

```
cex-arbitrage-finder/
├── public/                     # Static files
├── src/
│   ├── components/            # React components
│   │   ├── ArbitrageCard.tsx           # Spatial arbitrage card
│   │   ├── TriangularArbitrageCard.tsx # Triangular arbitrage card
│   │   ├── CrossTriangularArbitrageCard.tsx # Cross-exchange triangular card
│   │   ├── StatisticalArbitrageCard.tsx     # Statistical arbitrage card
│   │   ├── FlashArbitrageCard.tsx      # Flash arbitrage card
│   │   ├── OpportunityList.tsx         # Opportunities list
│   │   ├── StrategyStats.tsx           # Strategy statistics
│   │   ├── Header.tsx                  # App header
│   │   └── StatusIndicator.tsx         # Status indicator
│   ├── services/              # Services and APIs
│   │   └── blockchainDataService.ts    # Blockchain data service
│   ├── types.ts              # TypeScript type definitions
│   ├── constants.ts          # Constants and configuration
│   ├── App.tsx              # Main app component
│   └── index.tsx            # App entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── README.md              # Project documentation
```

## ⚙️ Configuration

### `constants.ts` File

```typescript
// Supported exchanges
export const SUPPORTED_CEXS: CexInfo[] = [
  { id: 'binance', name: 'Binance', logoUrl: '...' },
  { id: 'kraken', name: 'Kraken', logoUrl: '...' },
  { id: 'coinbase', name: 'Coinbase', logoUrl: '...' },
  { id: 'kucoin', name: 'KuCoin', logoUrl: '...' },
  { id: 'bybit', name: 'Bybit', logoUrl: '...' },
];

// Currency pairs to scan
export const PAIRS_TO_SCAN: string[] = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
  'XRP/USDT', 'DOGE/USDT', 'ADA/USDT',
  // ...
];

// Scanning parameters
export const REFRESH_INTERVAL_MS = 15000; // 15 seconds
export const MIN_PROFIT_PERCENTAGE_THRESHOLD = 0.1; // 0.1%
```

### Configurable Settings

1. **Update interval**: `REFRESH_INTERVAL_MS`
2. **Minimum profit**: `MIN_PROFIT_PERCENTAGE_THRESHOLD`
3. **Active exchanges**: `SUPPORTED_CEXS`
4. **Currency pairs**: `PAIRS_TO_SCAN`

## 🔌 API & Services

### `blockchainDataService.ts`

This service contains all arbitrage opportunity detection logic:

#### Main Functions:

1. **`generateMockData()`**: Generate simulated data
2. **`findSpatialOpportunities()`**: Identify spatial arbitrage
3. **`findTriangularOpportunities()`**: Identify triangular arbitrage
4. **`findCrossExchangeTriangularOpportunities()`**: Cross-exchange arbitrage
5. **`findStatisticalOpportunities()`**: Statistical arbitrage
6. **`findFlashOpportunities()`**: Flash arbitrage
7. **`fetchAllOpportunities()`**: Main collection function

#### Usage Example:

```typescript
import { fetchAllOpportunities } from './services/blockchainDataService';

const opportunities = await fetchAllOpportunities();
console.log(`Found ${opportunities.length} opportunities`);
```

## 🧩 Components

### Main Components

#### 1. `App.tsx`
- Global app state management
- Data update cycle
- Error handling

#### 2. `OpportunityList.tsx`
- Display opportunities list
- Filter by strategy type
- Category tabs

#### 3. `StrategyStats.tsx`
- Display overall statistics
- Strategy performance analysis
- Statistical cards

#### 4. Strategy Cards
Each strategy has its dedicated component:
- `ArbitrageCard.tsx`: Spatial arbitrage
- `TriangularArbitrageCard.tsx`: Triangular arbitrage
- `CrossTriangularArbitrageCard.tsx`: Cross-exchange triangular
- `StatisticalArbitrageCard.tsx`: Statistical arbitrage
- `FlashArbitrageCard.tsx`: Flash arbitrage

### UI/UX Features

- **Responsive design**: Compatible with mobile and desktop
- **Smart color coding**: Each strategy has its unique color
- **Smooth animations**: For better user experience
- **Visual icons**: For quick identification

## 🧮 Arbitrage Algorithms

### Spatial Arbitrage Algorithm

```typescript
function findSpatialOpportunities(exchanges: ExchangeData[]): Opportunity[] {
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

### Triangular Arbitrage Algorithm

```typescript
function findTriangularOpportunities(exchange: ExchangeData): Opportunity[] {
  const opportunities = [];
  const currencies = extractCurrencies(exchange.tickers);
  
  for (const [A, B, C] of generateTriangularPaths(currencies)) {
    const path1 = `${B}/${A}`;
    const path2 = `${C}/${B}`;
    const path3 = `${C}/${A}`;
    
    const rate1 = exchange.tickers[path1]?.ask;
    const rate2 = exchange.tickers[path2]?.ask;
    const rate3 = exchange.tickers[path3]?.bid;
    
    if (rate1 && rate2 && rate3) {
      let amount = 1.0;
      amount = amount / rate1;  // A → B
      amount = amount / rate2;  // B → C
      amount = amount * rate3;  // C → A
      
      const profit = (amount - 1.0) * 100;
      if (profit >= MIN_PROFIT_THRESHOLD) {
        opportunities.push({
          type: 'triangular',
          exchange: exchange.cex,
          path: [A, B, C],
          profitPercentage: profit
        });
      }
    }
  }
  
  return opportunities;
}
```

## ⚡ Performance Optimization

### Optimization Techniques

1. **React.memo**: Prevent unnecessary re-renders
2. **useMemo**: For heavy calculations
3. **useCallback**: For callback functions
4. **Lazy Loading**: For heavy components

### Memory Management

```typescript
// Cleanup in useEffect
useEffect(() => {
  const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
  return () => clearInterval(interval);
}, []);

// Limit displayed opportunities
const displayedOpportunities = opportunities.slice(0, MAX_DISPLAY_COUNT);
```

### Network Optimization

- **Debouncing**: For consecutive requests
- **Caching**: Temporary result storage
- **Error Handling**: Network error management

## 🔒 Security & Best Practices

### Data Security
- **No sensitive data storage**: No API keys or personal information stored
- **HTTPS**: Use secure connections
- **Input Validation**: Validate all inputs

### Code Best Practices
- **TypeScript**: For type safety
- **ESLint**: For code quality
- **Error Boundaries**: React error handling
- **Proper State Management**: Correct state handling

## 📊 Practical Examples

### Example 1: BTC/USDT Spatial Arbitrage

```
Exchange A (Binance): 
  - Buy price: $43,250
  - Sell price: $43,280

Exchange B (Kraken):
  - Buy price: $43,380
  - Sell price: $43,420

Arbitrage opportunity:
  - Buy from Binance: $43,280
  - Sell on Kraken: $43,380
  - Profit: $100 (0.23%)
```

### Example 2: Triangular Arbitrage

```
Exchange: Binance
Path: USDT → BTC → ETH → USDT

Step 1: 1000 USDT → BTC
  - Rate: 43,250 USDT/BTC
  - BTC amount: 0.02312 BTC

Step 2: 0.02312 BTC → ETH
  - Rate: 0.06 BTC/ETH
  - ETH amount: 0.3853 ETH

Step 3: 0.3853 ETH → USDT
  - Rate: 2,600 USDT/ETH
  - Final amount: 1,001.78 USDT

Profit: 1.78 USDT (0.178%)
```

## 🚨 Warnings & Limitations

### Important Warnings
⚠️ **This tool is for educational purposes only**
⚠️ **Profit calculations do not include fees and transfer costs**
⚠️ **Prices may change during execution**
⚠️ **Consider trading risks**

### Technical Limitations
- **CORS Issues**: Browser security may block direct API calls to exchanges
- **Rate Limits**: Exchange APIs have request limits that may affect data freshness
- **Market Depth**: Does not consider order book depth and slippage
- **Execution Time**: Prices may change during trade execution
- **Network Latency**: Real-world execution delays not accounted for

## 🤝 Contributing

### How to Contribute

1. **Fork the project**
2. **Create a new branch**:
   ```bash
   git checkout -b feature/new-strategy
   ```
3. **Make changes and commit**:
   ```bash
   git commit -m "Add new arbitrage strategy"
   ```
4. **Push changes**:
   ```bash
   git push origin feature/new-strategy
   ```
5. **Create Pull Request**

### Development Guide

#### Adding New Strategy

1. **Define type in `types.ts`**:
```typescript
export interface NewStrategyOpportunity {
  type: 'new-strategy';
  id: string;
  // other fields
}
```

2. **Implement algorithm in `blockchainDataService.ts`**:
```typescript
const findNewStrategyOpportunities = (data: ExchangeData[]): NewStrategyOpportunity[] => {
  // strategy logic
};
```

3. **Create UI component**:
```typescript
const NewStrategyCard: React.FC<{opportunity: NewStrategyOpportunity}> = ({opportunity}) => {
  // UI component
};
```

4. **Add to `OpportunityList.tsx`**

### Code Standards
- Use TypeScript for all files
- Follow ESLint rules
- Write meaningful comments
- Test changes

## 📈 Future Roadmap

### Technical Improvements

- [ ] **WebSocket** for real-time data
- [ ] **Service Worker** for offline functionality
- [ ] **PWA** capabilities
- [ ] **Comprehensive automated tests**
- [ ] **Complete CI/CD pipeline**

## 📞 Support & Contact

### Contact Methods
- **GitHub Issues**: For bug reports and feature requests
- **Email**: [your-email@example.com]
- **Discord**: [Discord server link]

### Frequently Asked Questions (FAQ)

**Q: Can this tool be used for real trading?**
A: No, this tool is designed for educational purposes only.

**Q: Why is the data simulated?**
A: To avoid API limitations and provide a stable experience.

**Q: How can I add a new strategy?**
A: Complete guide available in the "Contributing" section.

## 📄 License

This project is released under the MIT License. See the `LICENSE` file for details.

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