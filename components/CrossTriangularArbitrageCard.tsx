import React from 'react';
import { CrossExchangeTriangularOpportunity } from '../types';

interface CrossTriangularArbitrageCardProps {
  opportunity: CrossExchangeTriangularOpportunity;
}

const CrossTriangularArbitrageCard: React.FC<CrossTriangularArbitrageCardProps> = ({ opportunity }) => {
  const formatCurrency = (amount: number, decimals: number = 6) => {
    return amount.toFixed(decimals);
  };

  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(3);
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
          <span className="text-purple-300 font-medium text-sm">Cross-Exchange Triangular</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">
            +{formatPercentage(opportunity.profitPercentage)}%
          </div>
          <div className="text-xs text-gray-400">Profit</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-300 mb-2">Path:</div>
        <div className="flex items-center space-x-2 text-sm">
          {opportunity.path.map((currency, index) => (
            <React.Fragment key={currency}>
              <span className="bg-purple-800/50 px-2 py-1 rounded text-purple-200 font-mono">
                {currency}
              </span>
              {index < opportunity.path.length - 1 && (
                <span className="text-purple-400">→</span>
              )}
            </React.Fragment>
          ))}
          <span className="text-purple-400">→</span>
          <span className="bg-purple-800/50 px-2 py-1 rounded text-purple-200 font-mono">
            {opportunity.path[0]}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {opportunity.steps.map((step, index) => (
          <div key={index} className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={step.exchange.logoUrl} 
                  alt={step.exchange.name}
                  className="w-6 h-6 rounded-full"
                />
                <div>
                  <div className="text-sm font-medium text-white">{step.exchange.name}</div>
                  <div className="text-xs text-gray-400">{step.pair}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  step.action === 'BUY' ? 'text-blue-400' : 'text-orange-400'
                }`}>
                  {step.action}
                </div>
                <div className="text-xs text-gray-300 font-mono">
                  {formatCurrency(step.price)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-purple-500/20">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Multi-Exchange Strategy</span>
          <span>{new Date(opportunity.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default CrossTriangularArbitrageCard;