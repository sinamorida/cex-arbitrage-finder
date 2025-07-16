import React from 'react';
import { StatisticalArbitrageOpportunity } from '../types';

interface StatisticalArbitrageCardProps {
  opportunity: StatisticalArbitrageOpportunity;
}

const StatisticalArbitrageCard: React.FC<StatisticalArbitrageCardProps> = ({ opportunity }) => {
  const formatCurrency = (amount: number, decimals: number = 6) => {
    return amount.toFixed(decimals);
  };

  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(3);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getZScoreColor = (zScore: number) => {
    if (zScore >= 3) return 'text-red-400';
    if (zScore >= 2.5) return 'text-orange-400';
    return 'text-yellow-400';
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 border border-indigo-500/30 rounded-xl p-6 hover:border-indigo-400/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
          <span className="text-indigo-300 font-medium text-sm">Statistical Arbitrage</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">
            +{formatPercentage(opportunity.expectedReturn)}%
          </div>
          <div className="text-xs text-gray-400">Expected Return</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-lg font-semibold text-white mb-2">{opportunity.pair}</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <img 
                src={opportunity.exchanges.primary.logoUrl} 
                alt={opportunity.exchanges.primary.name}
                className="w-5 h-5 rounded-full"
              />
              <span className="text-sm text-gray-300">{opportunity.exchanges.primary.name}</span>
            </div>
            <div className="text-lg font-mono text-white">
              ${formatCurrency(opportunity.prices.primary)}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <img 
                src={opportunity.exchanges.secondary.logoUrl} 
                alt={opportunity.exchanges.secondary.name}
                className="w-5 h-5 rounded-full"
              />
              <span className="text-sm text-gray-300">{opportunity.exchanges.secondary.name}</span>
            </div>
            <div className="text-lg font-mono text-white">
              ${formatCurrency(opportunity.prices.secondary)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800/30 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold ${getZScoreColor(opportunity.zScore)}`}>
            {opportunity.zScore.toFixed(2)}σ
          </div>
          <div className="text-xs text-gray-400">Z-Score</div>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold ${getConfidenceColor(opportunity.confidence)}`}>
            {opportunity.confidence.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-400">Confidence</div>
        </div>
      </div>

      <div className="bg-indigo-900/30 rounded-lg p-3 mb-4">
        <div className="text-xs text-indigo-300 mb-1">Strategy</div>
        <div className="text-sm text-gray-300">
          Mean reversion based on price correlation analysis
        </div>
      </div>

      <div className="pt-3 border-t border-indigo-500/20">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Statistical Model</span>
          <span>{new Date(opportunity.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default StatisticalArbitrageCard;