import React, { useState } from 'react';
import { ArbitrageOpportunity, CexInfo } from '../types';

interface ArbitrageCardProps {
  opportunity: ArbitrageOpportunity;
}

const ArrowLongRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
    </svg>
);

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

const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

const timeAgo = (ts: number): string => {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return `just now`;
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const ExchangeInfo: React.FC<{ label: string; exchange: CexInfo; price: number; pair: string; labelColor: string }> = ({ label, exchange, price, pair, labelColor }) => (
  <div className="flex-1 p-4 bg-gray-700/50 rounded-lg text-center">
    <p className={`text-sm font-semibold uppercase ${labelColor}`}>{label}</p>
    <div className="flex items-center justify-center my-2">
      <img 
        src={exchange.logoUrl || `https://ui-avatars.com/api/?name=${exchange.name}&size=24&background=random`} 
        alt={exchange.name} 
        className="w-6 h-6 rounded-full mr-2"
      />
      <span className="text-lg font-medium text-gray-200">{exchange.name}</span>
    </div>
    <p className="text-xl font-bold text-gray-100">{formatPrice(price, pair)}</p>
  </div>
);

const ArbitrageCard: React.FC<ArbitrageCardProps> = ({ opportunity }) => {
  const { pair, buyAt, sellAt, profitPercentage, timestamp } = opportunity;
  const [baseAsset, quoteAsset] = pair.split('/');
  const [showDetails, setShowDetails] = useState(false);

  // محاسبه جزئیات اضافی
  const spread = sellAt.price - buyAt.price;
  const spreadPercentage = (spread / buyAt.price) * 100;
  const estimatedVolume = 1000; // فرضی
  const estimatedProfit = estimatedVolume * spread;

  // تعیین سطح ریسک بر اساس درصد سود
  const getRiskLevel = () => {
    if (profitPercentage > 2) return { level: 'HIGH', color: 'text-red-400', bgColor: 'bg-red-900/20' };
    if (profitPercentage > 0.5) return { level: 'MEDIUM', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' };
    return { level: 'LOW', color: 'text-green-400', bgColor: 'bg-green-900/20' };
  };

  const riskInfo = getRiskLevel();

  return (
    <div className="bg-gray-800 shadow-xl rounded-lg p-5 hover:shadow-cyan-500/20 transition-shadow duration-300 flex flex-col h-full ring-1 ring-gray-700 hover:ring-cyan-600">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-sky-300">{pair}</h3>
        </div>
        <div className="px-2 py-1 bg-green-500/10 rounded">
          <p className="text-sm font-bold text-green-300">+{formatPercentage(profitPercentage)}</p>
        </div>
      </div>

      {/* Arbitrage Path */}
      <div className="flex items-center justify-center gap-2 my-2">
        <ExchangeInfo label="خرید از" exchange={buyAt.exchange} price={buyAt.price} pair={pair} labelColor="text-red-400" />
        <ArrowLongRightIcon className="w-8 h-8 text-sky-500 flex-shrink-0" />
        <ExchangeInfo label="فروش در" exchange={sellAt.exchange} price={sellAt.price} pair={pair} labelColor="text-green-400" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="bg-gray-700/50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Spread</p>
          <p className="text-sm font-medium text-gray-200">{formatPrice(spread, pair)}</p>
        </div>
        <div className={`rounded-lg p-2 text-center ${riskInfo.bgColor}`}>
          <p className="text-xs text-gray-400">ریسک</p>
          <p className={`text-sm font-medium ${riskInfo.color}`}>
            {riskInfo.level === 'HIGH' ? 'بالا' : riskInfo.level === 'MEDIUM' ? 'متوسط' : 'کم'}
          </p>
        </div>
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center justify-center space-x-2 py-2 text-sm text-sky-400 hover:text-sky-300 transition-colors"
      >
        <span>{showDetails ? 'کمتر' : 'جزئیات بیشتر'}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDetails && (
        <div className="mt-3 space-y-3 border-t border-gray-700 pt-3">
          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400">Spread درصدی:</span>
              <span className="text-gray-200 mr-2">{formatPercentage(spreadPercentage)}</span>
            </div>
            <div>
              <span className="text-gray-400">سود تخمینی:</span>
              <span className="text-green-400 mr-2">{formatPrice(estimatedProfit, pair)}</span>
            </div>
          </div>

          {/* Execution Steps */}
          <div className="bg-gray-700/30 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-300 mb-2">مراحل اجرا:</h4>
            <ol className="text-xs text-gray-400 space-y-1">
              <li>1. خرید {baseAsset} از {buyAt.exchange.name} به قیمت {formatPrice(buyAt.price, pair)}</li>
              <li>2. انتقال {baseAsset} به {sellAt.exchange.name}</li>
              <li>3. فروش {baseAsset} در {sellAt.exchange.name} به قیمت {formatPrice(sellAt.price, pair)}</li>
              <li>4. سود خالص: {formatPercentage(profitPercentage)}</li>
            </ol>
          </div>

          {/* Risk Factors */}
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
            <h4 className="text-sm font-medium text-yellow-400 mb-2">عوامل ریسک:</h4>
            <ul className="text-xs text-yellow-300 space-y-1">
              <li>• کارمزد معاملات و انتقال</li>
              <li>• تغییر قیمت در طول اجرا</li>
              <li>• زمان انتقال بین صرافی‌ها</li>
              <li>• محدودیت‌های نقدینگی</li>
            </ul>
          </div>

          {/* Confidence Score */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">امتیاز اعتماد:</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: '85%' }}
                ></div>
              </div>
              <span className="text-xs text-emerald-400">85%</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-4 text-center">
         <p className="text-xs text-gray-400">
           خرید <span className="font-semibold text-gray-300">{baseAsset}</span> از <span className="font-semibold text-gray-300">{buyAt.exchange.name}</span>،
           فروش در <span className="font-semibold text-gray-300">{sellAt.exchange.name}</span>
         </p>
         <p className="text-xs text-gray-500 mt-2">
           این محاسبه شامل کارمزد معاملات، انتقال یا شبکه نمی‌شود.
         </p>
       </div>
      
      <div className="text-right text-xs text-gray-500 mt-4">
        شناسایی شده: {timeAgo(timestamp)}
      </div>
    </div>
  );
};

export default ArbitrageCard;
