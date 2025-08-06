import React from 'react';
import { PairsArbitrageOpportunity } from '../types';

interface PairsArbitrageCardProps {
  opportunity: PairsArbitrageOpportunity;
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

const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
const formatDecimal = (value: number, decimals: number = 3) => value.toFixed(decimals);

const timeAgo = (ts: number): string => {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return `همین الان`;
  if (seconds < 60) return `${seconds} ثانیه پیش`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  return `${hours} ساعت پیش`;
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-green-400';
  if (confidence >= 60) return 'text-yellow-400';
  if (confidence >= 40) return 'text-orange-400';
  return 'text-red-400';
};

const getCorrelationColor = (correlation: number) => {
  const absCorr = Math.abs(correlation);
  if (absCorr >= 0.8) return 'text-green-400';
  if (absCorr >= 0.6) return 'text-yellow-400';
  return 'text-orange-400';
};

const PairsArbitrageCard: React.FC<PairsArbitrageCardProps> = ({ opportunity }) => {
  const { 
    pair1, 
    pair2, 
    exchange, 
    correlation, 
    zscore, 
    expectedReturn, 
    confidence, 
    hedgeRatio, 
    prices, 
    timestamp 
  } = opportunity;

  return (
    <div className="bg-gray-800 shadow-xl rounded-lg p-5 hover:shadow-teal-500/20 transition-shadow duration-300 flex flex-col h-full ring-1 ring-gray-700 hover:ring-teal-600">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-teal-500 rounded-full mr-2"></div>
          <h3 className="text-lg font-bold text-teal-300">{pair1} / {pair2}</h3>
        </div>
        <div className="px-2 py-1 bg-teal-500/10 rounded">
          <p className="text-sm font-bold text-teal-300">+{formatPercentage(expectedReturn)}</p>
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
          <p className="text-xs text-gray-400">Pairs Trading</p>
        </div>
      </div>

      {/* Pair Prices */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-blue-400 mb-1">{pair1}</p>
          <p className="text-sm font-bold text-gray-100">{formatPrice(prices.pair1, pair1)}</p>
        </div>
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-purple-400 mb-1">{pair2}</p>
          <p className="text-sm font-bold text-gray-100">{formatPrice(prices.pair2, pair2)}</p>
        </div>
      </div>

      {/* Statistical Metrics */}
      <div className="space-y-3 mb-4">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">Z-Score</span>
            <span className="text-sm font-medium text-teal-300">
              {formatDecimal(zscore)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">همبستگی</span>
            <span className={`text-sm font-medium ${getCorrelationColor(correlation)}`}>
              {formatDecimal(correlation)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">ضریب پوشش</span>
            <span className="text-sm font-medium text-gray-300">
              {formatDecimal(hedgeRatio)}
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Level */}
      <div className="text-center mb-4">
        <p className="text-xs text-gray-400 mb-1">سطح اعتماد</p>
        <p className={`text-lg font-bold ${getConfidenceColor(confidence)}`}>
          {formatPercentage(confidence)}
        </p>
      </div>

      {/* Strategy Description */}
      <div className="mt-auto pt-4 text-center">
        <p className="text-xs text-gray-400 mb-2">
          معاملات جفتی بر اساس انحراف آماری از میانگین تاریخی
        </p>
        <p className="text-xs text-gray-500">
          استراتژی بر اساس بازگشت به میانگین و همبستگی تاریخی جفت ارزها
        </p>
      </div>
      
      <div className="text-right text-xs text-gray-500 mt-4">
        شناسایی شده: {timeAgo(timestamp)}
      </div>
    </div>
  );
};

export default PairsArbitrageCard;