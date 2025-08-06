import React from 'react';
import { MarketMakingOpportunity } from '../types';

interface MarketMakingCardProps {
  opportunity: MarketMakingOpportunity;
}

const formatPrice = (price: number, pair: string) => {
  const quoteCurrency = pair.split('/')[1];
  let options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  };
  if (quoteCurrency === 'USDT' || quoteCurrency === 'USDC' || quoteCurrency === 'EUR' || quoteCurrency === 'USD') {
    options.style = 'currency';
    options.currency = quoteCurrency === 'EUR' ? 'EUR' : 'USD';
    options.currencyDisplay = 'narrowSymbol';
  }
  return new Intl.NumberFormat('en-US', options).format(price);
};

const formatPercentage = (value: number) => `${value.toFixed(3)}%`;

const timeAgo = (ts: number): string => {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return `همین الان`;
  if (seconds < 60) return `${seconds} ثانیه پیش`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  return `${hours} ساعت پیش`;
};

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'LOW': return 'text-green-400';
    case 'MEDIUM': return 'text-yellow-400';
    case 'HIGH': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

const getLiquidityColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

const MarketMakingCard: React.FC<MarketMakingCardProps> = ({ opportunity }) => {
  const { 
    pair, 
    exchange, 
    bidPrice, 
    askPrice, 
    spread, 
    spreadPercentage, 
    volume, 
    profitPercentage, 
    riskLevel, 
    liquidityScore, 
    timestamp 
  } = opportunity;

  const [baseAsset, quoteAsset] = pair.split('/');

  return (
    <div className="bg-gray-800 shadow-xl rounded-lg p-5 hover:shadow-orange-500/20 transition-shadow duration-300 flex flex-col h-full ring-1 ring-gray-700 hover:ring-orange-600">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
          <h3 className="text-xl font-bold text-orange-300">{pair}</h3>
        </div>
        <div className="px-2 py-1 bg-orange-500/10 rounded">
          <p className="text-sm font-bold text-orange-300">+{formatPercentage(profitPercentage)}</p>
        </div>
      </div>

      {/* Exchange Info */}
      <div className="flex items-center justify-center mb-4 p-3 bg-gray-700/50 rounded-lg">
        <img 
          src={exchange.logoUrl || `https://ui-avatars.com/api/?name=${exchange.name}&size=32&background=random`} 
          alt={exchange.name} 
          className="w-8 h-8 rounded-full mr-3"
        />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-200">{exchange.name}</p>
          <p className="text-xs text-gray-400">Market Making</p>
        </div>
      </div>

      {/* Bid/Ask Prices */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-red-400 mb-1">BID</p>
          <p className="text-sm font-bold text-gray-100">{formatPrice(bidPrice, pair)}</p>
        </div>
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-green-400 mb-1">ASK</p>
          <p className="text-sm font-bold text-gray-100">{formatPrice(askPrice, pair)}</p>
        </div>
      </div>

      {/* Spread Info */}
      <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">Spread</span>
          <span className="text-sm font-medium text-orange-300">
            {formatPrice(spread, pair)} ({formatPercentage(spreadPercentage)})
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">حجم</span>
          <span className="text-sm font-medium text-gray-300">
            {volume.toLocaleString()} {baseAsset}
          </span>
        </div>
      </div>

      {/* Risk and Liquidity */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">سطح ریسک</p>
          <p className={`text-sm font-bold ${getRiskColor(riskLevel)}`}>
            {riskLevel === 'LOW' ? 'کم' : riskLevel === 'MEDIUM' ? 'متوسط' : 'بالا'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">نقدینگی</p>
          <p className={`text-sm font-bold ${getLiquidityColor(liquidityScore)}`}>
            {liquidityScore}/100
          </p>
        </div>
      </div>

      {/* Strategy Description */}
      <div className="mt-auto pt-4 text-center">
        <p className="text-xs text-gray-400 mb-2">
          سود از طریق قرار دادن سفارش‌های خرید و فروش در spread بازار
        </p>
        <p className="text-xs text-gray-500">
          این محاسبه شامل کارمزد معاملات و ریسک‌های اجرا نمی‌شود.
        </p>
      </div>
      
      <div className="text-right text-xs text-gray-500 mt-4">
        شناسایی شده: {timeAgo(timestamp)}
      </div>
    </div>
  );
};

export default MarketMakingCard;