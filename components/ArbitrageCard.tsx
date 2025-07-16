import React from 'react';
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

  return (
    <div className="bg-gray-800 shadow-xl rounded-lg p-5 hover:shadow-cyan-500/20 transition-shadow duration-300 flex flex-col h-full ring-1 ring-gray-700 hover:ring-cyan-600">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-sky-300">{pair}</h3>
        <div className="px-2 py-1 bg-green-500/10 rounded">
          <p className="text-sm font-bold text-green-300">+{formatPercentage(profitPercentage)}</p>
        </div>
      </div>

      {/* Arbitrage Path */}
      <div className="flex items-center justify-center gap-2 my-2">
        <ExchangeInfo label="Buy At" exchange={buyAt.exchange} price={buyAt.price} pair={pair} labelColor="text-red-400" />
        <ArrowLongRightIcon className="w-8 h-8 text-sky-500 flex-shrink-0" />
        <ExchangeInfo label="Sell At" exchange={sellAt.exchange} price={sellAt.price} pair={pair} labelColor="text-green-400" />
      </div>

      {/* Details */}
      <div className="mt-auto pt-4 text-center">
         <p className="text-xs text-gray-400">
           Buy <span className="font-semibold text-gray-300">{baseAsset}</span> on <span className="font-semibold text-gray-300">{buyAt.exchange.name}</span>,
           sell on <span className="font-semibold text-gray-300">{sellAt.exchange.name}</span>.
         </p>
         <p className="text-xs text-gray-500 mt-2">
           This is a gross profit calculation and does not include trading, withdrawal, or network fees.
         </p>
       </div>
      
      <div className="text-right text-xs text-gray-500 mt-4">
        Detected: {timeAgo(timestamp)}
      </div>
    </div>
  );
};

export default ArbitrageCard;
