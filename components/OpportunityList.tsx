import React, { useState } from 'react';
import { AnyOpportunity } from '../types';
import ArbitrageCard from './ArbitrageCard';
import TriangularArbitrageCard from './TriangularArbitrageCard';
import CrossTriangularArbitrageCard from './CrossTriangularArbitrageCard';
import StatisticalArbitrageCard from './StatisticalArbitrageCard';
import FlashArbitrageCard from './FlashArbitrageCard';
import MarketMakingCard from './MarketMakingCard';
import PairsArbitrageCard from './PairsArbitrageCard';
import AdvancedFilters from './AdvancedFilters';

interface OpportunityListProps {
  opportunities: AnyOpportunity[];
}

const OpportunityList: React.FC<OpportunityListProps> = ({ opportunities }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [filteredOpportunities, setFilteredOpportunities] = useState<AnyOpportunity[]>(opportunities);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  if (opportunities.length === 0) {
    return null; 
  }

  // Group opportunities by type
  const opportunityStats = {
    spatial: opportunities.filter(op => op.type === 'spatial').length,
    triangular: opportunities.filter(op => op.type === 'triangular').length,
    crossTriangular: opportunities.filter(op => op.type === 'cross-triangular').length,
    statistical: opportunities.filter(op => op.type === 'statistical').length,
    flash: opportunities.filter(op => op.type === 'flash').length,
    marketMaking: opportunities.filter(op => op.type === 'market-making').length,
    pairs: opportunities.filter(op => op.type === 'pairs').length,
  };

  // Filter opportunities based on selected filter (basic filter)
  const basicFilteredOpportunities = selectedFilter === 'all' 
    ? opportunities 
    : opportunities.filter(op => op.type === selectedFilter);

  // Use advanced filtered opportunities if available, otherwise use basic filter
  const displayOpportunities = showAdvancedFilters ? filteredOpportunities : basicFilteredOpportunities;

  const renderOpportunityCard = (opportunity: AnyOpportunity) => {
    switch (opportunity.type) {
      case 'triangular':
        return <TriangularArbitrageCard key={opportunity.id} opportunity={opportunity} />;
      case 'cross-triangular':
        return <CrossTriangularArbitrageCard key={opportunity.id} opportunity={opportunity} />;
      case 'statistical':
        return <StatisticalArbitrageCard key={opportunity.id} opportunity={opportunity} />;
      case 'flash':
        return <FlashArbitrageCard key={opportunity.id} opportunity={opportunity} />;
      case 'market-making':
        return <MarketMakingCard key={opportunity.id} opportunity={opportunity} />;
      case 'pairs':
        return <PairsArbitrageCard key={opportunity.id} opportunity={opportunity} />;
      default:
        return <ArbitrageCard key={opportunity.id} opportunity={opportunity as any} />;
    }
  };

  return (
    <div>
      {/* Advanced Filters */}
      <AdvancedFilters
        opportunities={opportunities}
        onFilterChange={setFilteredOpportunities}
        isOpen={showAdvancedFilters}
        onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

      {/* Strategy Filter Tabs */}
      <div className="mb-6 bg-gray-800/50 rounded-xl p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedFilter === 'all'
                ? 'bg-sky-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All ({opportunities.length})
          </button>
          
          {opportunityStats.spatial > 0 && (
            <button
              onClick={() => setSelectedFilter('spatial')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === 'spatial'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Spatial ({opportunityStats.spatial})
            </button>
          )}
          
          {opportunityStats.triangular > 0 && (
            <button
              onClick={() => setSelectedFilter('triangular')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === 'triangular'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Triangular ({opportunityStats.triangular})
            </button>
          )}
          
          {opportunityStats.crossTriangular > 0 && (
            <button
              onClick={() => setSelectedFilter('cross-triangular')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === 'cross-triangular'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Cross-Triangular ({opportunityStats.crossTriangular})
            </button>
          )}
          
          {opportunityStats.statistical > 0 && (
            <button
              onClick={() => setSelectedFilter('statistical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === 'statistical'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Statistical ({opportunityStats.statistical})
            </button>
          )}
          
          {opportunityStats.flash > 0 && (
            <button
              onClick={() => setSelectedFilter('flash')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === 'flash'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Flash ({opportunityStats.flash})
            </button>
          )}
          
          {opportunityStats.marketMaking > 0 && (
            <button
              onClick={() => setSelectedFilter('market-making')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === 'market-making'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Market Making ({opportunityStats.marketMaking})
            </button>
          )}
          
          {opportunityStats.pairs > 0 && (
            <button
              onClick={() => setSelectedFilter('pairs')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === 'pairs'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Pairs ({opportunityStats.pairs})
            </button>
          )}
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayOpportunities.map(renderOpportunityCard)}
      </div>
    </div>
  );
};

export default OpportunityList;
