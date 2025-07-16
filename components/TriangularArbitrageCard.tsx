import React from 'react';
import { TriangularArbitrageOpportunity } from '../types';

interface TriangularArbitrageCardProps {
  opportunity: TriangularArbitrageOpportunity;
}

const formatPercentage = (value: number) => `${value.toFixed(3)}%`;

const timeAgo = (ts: number): string => {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return `just now`;
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const ArrowStep: React.FC<{ pair: string, action: string }> = ({ pair, action }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-center mx-1">
        <p className="text-xs text-sky-400 font-mono">{pair}</p>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500 my-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
        </svg>
        <p className={`text-xs font-bold ${action === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{action}</p>
    </div>
);

const Asset: React.FC<{ currency: string }> = ({ currency }) => (
    <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-sky-300">
            {currency.slice(0, 3)}
        </div>
        <p className="text-sm mt-1">{currency}</p>
    </div>
);

const TriangularArbitrageCard: React.FC<TriangularArbitrageCardProps> = ({ opportunity }) => {
  const { exchange, path, steps, profitPercentage, timestamp } = opportunity;

  return (
    <div className="bg-gray-800 shadow-xl rounded-lg p-5 hover:shadow-purple-500/20 transition-shadow duration-300 flex flex-col h-full ring-1 ring-gray-700 hover:ring-purple-600">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
            <img 
                src={exchange.logoUrl || `https://ui-avatars.com/api/?name=${exchange.name}&size=32&background=random`} 
                alt={exchange.name} 
                className="w-8 h-8 rounded-full mr-3"
            />
            <h3 className="text-lg font-bold text-purple-300">{exchange.name}</h3>
        </div>
        <div className="px-2 py-1 bg-green-500/10 rounded">
          <p className="text-sm font-bold text-green-300">+{formatPercentage(profitPercentage)}</p>
        </div>
      </div>
      
      <p className="text-center text-xs text-gray-400 mb-4">Triangular Arbitrage Path</p>

      {/* Arbitrage Path */}
      <div className="flex items-center justify-between text-gray-200">
          <Asset currency={path[0]}/>
          <ArrowStep pair={steps[0].pair} action={steps[0].action} />
          <Asset currency={path[1]}/>
          <ArrowStep pair={steps[1].pair} action={steps[1].action} />
          <Asset currency={path[2]}/>
      </div>
       <div className="flex items-center justify-center mt-3">
          <div className="w-full border-t border-dashed border-gray-600 relative" style={{'height': '20px'}}>
             <div className="absolute left-0 -top-3.5 transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500 transform -rotate-90">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
                </svg>
             </div>
             <div className="absolute right-0 -top-3.5 transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500 transform rotate-180">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                </svg>
             </div>
          </div>
       </div>

       <div className="flex items-center justify-center">
          <ArrowStep pair={steps[2].pair} action={steps[2].action} />
       </div>


      {/* Footer */}
      <div className="mt-auto pt-4 text-center">
         <p className="text-xs text-gray-500 mt-2">
           Gross profit calculation. Does not include trading fees.
         </p>
       </div>
      
      <div className="text-right text-xs text-gray-500 mt-4">
        Detected: {timeAgo(timestamp)}
      </div>
    </div>
  );
};

export default TriangularArbitrageCard;
