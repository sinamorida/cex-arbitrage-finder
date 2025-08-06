import React from 'react';
import { AnyOpportunity } from '../types';

interface StrategyStatsProps {
  opportunities: AnyOpportunity[];
}

const StrategyStats: React.FC<StrategyStatsProps> = ({ opportunities }) => {
  const stats = {
    spatial: opportunities.filter(op => op.type === 'spatial'),
    triangular: opportunities.filter(op => op.type === 'triangular'),
    crossTriangular: opportunities.filter(op => op.type === 'cross-triangular'),
    statistical: opportunities.filter(op => op.type === 'statistical'),
    flash: opportunities.filter(op => op.type === 'flash'),
    marketMaking: opportunities.filter(op => op.type === 'market-making'),
    pairs: opportunities.filter(op => op.type === 'pairs'),
  };

  const totalProfit = opportunities.reduce((sum, op) => {
    if (op.type === 'statistical') {
      return sum + op.expectedReturn;
    } else if (op.type === 'pairs') {
      return sum + op.expectedReturn;
    }
    return sum + op.profitPercentage;
  }, 0);

  const avgProfit = opportunities.length > 0 ? totalProfit / opportunities.length : 0;

  const bestOpportunity = opportunities.reduce((best, current) => {
    const currentProfit = current.type === 'statistical' ? current.expectedReturn : 
                         current.type === 'pairs' ? current.expectedReturn : current.profitPercentage;
    const bestProfit = best.type === 'statistical' ? best.expectedReturn : 
                      best.type === 'pairs' ? best.expectedReturn : best.profitPercentage;
    return currentProfit > bestProfit ? current : best;
  }, opportunities[0]);

  const strategyCards = [
    {
      name: 'Spatial',
      count: stats.spatial.length,
      color: 'emerald',
      description: 'Cross-exchange price differences',
      icon: '🔄'
    },
    {
      name: 'Triangular',
      count: stats.triangular.length,
      color: 'blue',
      description: 'Single exchange currency cycles',
      icon: '🔺'
    },
    {
      name: 'Cross-Triangular',
      count: stats.crossTriangular.length,
      color: 'purple',
      description: 'Multi-exchange triangular paths',
      icon: '🌐'
    },
    {
      name: 'Statistical',
      count: stats.statistical.length,
      color: 'indigo',
      description: 'Mean reversion opportunities',
      icon: '📊'
    },
    {
      name: 'Flash',
      count: stats.flash.length,
      color: 'red',
      description: 'High-speed opportunities',
      icon: '⚡'
    },
    {
      name: 'Market Making',
      count: stats.marketMaking.length,
      color: 'orange',
      description: 'Bid-ask spread opportunities',
      icon: '💰'
    },
    {
      name: 'Pairs',
      count: stats.pairs.length,
      color: 'teal',
      description: 'Statistical pairs trading',
      icon: '📈'
    }
  ];

  if (opportunities.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-sky-900/40 to-sky-800/20 border border-sky-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-sky-400">{opportunities.length}</div>
          <div className="text-sm text-gray-400">Total Opportunities</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">+{avgProfit.toFixed(3)}%</div>
          <div className="text-sm text-gray-400">Average Profit</div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-400">
            +{bestOpportunity ? (bestOpportunity.type === 'statistical' ? bestOpportunity.expectedReturn.toFixed(3) : bestOpportunity.profitPercentage.toFixed(3)) : '0.000'}%
          </div>
          <div className="text-sm text-gray-400">Best Opportunity</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-400">{strategyCards.filter(s => s.count > 0).length}</div>
          <div className="text-sm text-gray-400">Active Strategies</div>
        </div>
      </div>

      {/* Strategy Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {strategyCards.map((strategy) => (
          <div
            key={strategy.name}
            className={`bg-gradient-to-br from-${strategy.color}-900/40 to-${strategy.color}-800/20 border border-${strategy.color}-500/30 rounded-xl p-4 ${
              strategy.count === 0 ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{strategy.icon}</span>
              <div className={`text-xl font-bold text-${strategy.color}-400`}>
                {strategy.count}
              </div>
            </div>
            <div className={`text-sm font-medium text-${strategy.color}-300 mb-1`}>
              {strategy.name}
            </div>
            <div className="text-xs text-gray-400">
              {strategy.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategyStats;