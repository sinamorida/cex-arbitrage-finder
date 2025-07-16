import React from 'react';
import { FlashArbitrageOpportunity } from '../types';

interface FlashArbitrageCardProps {
  opportunity: FlashArbitrageOpportunity;
}

const FlashArbitrageCard: React.FC<FlashArbitrageCardProps> = ({ opportunity }) => {
  const formatCurrency = (amount: number, decimals: number = 6) => {
    return amount.toFixed(decimals);
  };

  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(3);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'text-red-400 bg-red-900/30 border-red-500/50';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50';
      default: return 'text-green-400 bg-green-900/30 border-green-500/50';
    }
  };

  const formatTimeWindow = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className="bg-gradient-to-br from-red-900/40 to-orange-800/20 border border-red-500/30 rounded-xl p-6 hover:border-red-400/50 transition-all duration-300 relative overflow-hidden">
      {/* Animated background for urgency */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
            <span className="text-red-300 font-medium text-sm">Flash Arbitrage</span>
            <div className={`px-2 py-1 rounded-full text-xs font-bold border ${getUrgencyColor(opportunity.urgency)}`}>
              {opportunity.urgency}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              +{formatPercentage(opportunity.profitPercentage)}%
            </div>
            <div className="text-xs text-gray-400">Quick Profit</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-lg font-semibold text-white mb-3">{opportunity.pair}</div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <img 
                  src={opportunity.buyAt.exchange.logoUrl} 
                  alt={opportunity.buyAt.exchange.name}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-sm text-blue-300">{opportunity.buyAt.exchange.name}</span>
              </div>
              <div className="text-sm text-blue-400 font-medium">BUY</div>
              <div className="text-lg font-mono text-white">
                ${formatCurrency(opportunity.buyAt.price)}
              </div>
            </div>
            
            <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <img 
                  src={opportunity.sellAt.exchange.logoUrl} 
                  alt={opportunity.sellAt.exchange.name}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-sm text-orange-300">{opportunity.sellAt.exchange.name}</span>
              </div>
              <div className="text-sm text-orange-400 font-medium">SELL</div>
              <div className="text-lg font-mono text-white">
                ${formatCurrency(opportunity.sellAt.price)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-300">Time Window</div>
              <div className="text-lg font-bold text-red-400">
                {formatTimeWindow(opportunity.timeWindow)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-300">Profit</div>
              <div className="text-lg font-bold text-green-400">
                ${formatCurrency((opportunity.sellAt.price - opportunity.buyAt.price), 2)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-300 font-medium">
              ⚡ High-speed execution required - opportunity may disappear quickly
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-red-500/20">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Flash Strategy</span>
            <span>{new Date(opportunity.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashArbitrageCard;