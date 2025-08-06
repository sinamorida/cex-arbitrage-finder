import React, { useState, useEffect } from 'react';
import { AnyOpportunity } from '../types';
import { SUPPORTED_CEXS, PAIRS_TO_SCAN } from '../constants';

export interface FilterCriteria {
  strategyTypes: string[];
  minProfit: number;
  maxProfit: number;
  exchanges: string[];
  pairs: string[];
  riskLevels: string[];
  timeRange: {
    start: number;
    end: number;
  };
  sortBy: 'profit' | 'timestamp' | 'risk' | 'confidence';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  opportunities: AnyOpportunity[];
  onFilterChange: (filteredOpportunities: AnyOpportunity[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  opportunities,
  onFilterChange,
  isOpen,
  onToggle
}) => {
  const [filters, setFilters] = useState<FilterCriteria>({
    strategyTypes: [],
    minProfit: 0,
    maxProfit: 100,
    exchanges: [],
    pairs: [],
    riskLevels: [],
    timeRange: {
      start: Date.now() - 3600000, // آخرین ساعت
      end: Date.now()
    },
    sortBy: 'profit',
    sortOrder: 'desc'
  });

  const [savedFilters, setSavedFilters] = useState<{ [name: string]: FilterCriteria }>({});

  // بارگذاری فیلترهای ذخیره شده از localStorage
  useEffect(() => {
    const saved = localStorage.getItem('arbitrage-filters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, []);

  // اعمال فیلترها
  useEffect(() => {
    const filtered = applyFilters(opportunities, filters);
    onFilterChange(filtered);
  }, [opportunities, filters, onFilterChange]);

  const applyFilters = (ops: AnyOpportunity[], criteria: FilterCriteria): AnyOpportunity[] => {
    let filtered = [...ops];

    // فیلتر بر اساس نوع استراتژی
    if (criteria.strategyTypes.length > 0) {
      filtered = filtered.filter(op => criteria.strategyTypes.includes(op.type));
    }

    // فیلتر بر اساس سود
    filtered = filtered.filter(op => {
      const profit = getOpportunityProfit(op);
      return profit >= criteria.minProfit && profit <= criteria.maxProfit;
    });

    // فیلتر بر اساس صرافی
    if (criteria.exchanges.length > 0) {
      filtered = filtered.filter(op => {
        const exchanges = getOpportunityExchanges(op);
        return exchanges.some(ex => criteria.exchanges.includes(ex));
      });
    }

    // فیلتر بر اساس جفت ارز
    if (criteria.pairs.length > 0) {
      filtered = filtered.filter(op => {
        const pairs = getOpportunityPairs(op);
        return pairs.some(pair => criteria.pairs.includes(pair));
      });
    }

    // فیلتر بر اساس سطح ریسک
    if (criteria.riskLevels.length > 0) {
      filtered = filtered.filter(op => {
        const riskLevel = getOpportunityRiskLevel(op);
        return criteria.riskLevels.includes(riskLevel);
      });
    }

    // فیلتر بر اساس زمان
    filtered = filtered.filter(op => 
      op.timestamp >= criteria.timeRange.start && 
      op.timestamp <= criteria.timeRange.end
    );

    // مرتب‌سازی
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (criteria.sortBy) {
        case 'profit':
          aValue = getOpportunityProfit(a);
          bValue = getOpportunityProfit(b);
          break;
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'risk':
          aValue = getRiskScore(a);
          bValue = getRiskScore(b);
          break;
        case 'confidence':
          aValue = getConfidenceScore(a);
          bValue = getConfidenceScore(b);
          break;
        default:
          return 0;
      }

      return criteria.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  };

  // توابع کمکی
  const getOpportunityProfit = (op: AnyOpportunity): number => {
    if (op.type === 'statistical' || op.type === 'pairs') {
      return op.expectedReturn;
    }
    return op.profitPercentage;
  };

  const getOpportunityExchanges = (op: AnyOpportunity): string[] => {
    switch (op.type) {
      case 'spatial':
      case 'flash':
        return [op.buyAt.exchange.id, op.sellAt.exchange.id];
      case 'triangular':
      case 'market-making':
        return [op.exchange.id];
      case 'cross-triangular':
        return op.steps.map(step => step.exchange.id);
      case 'statistical':
      case 'pairs':
        return [op.exchange.id];
      default:
        return [];
    }
  };

  const getOpportunityPairs = (op: AnyOpportunity): string[] => {
    switch (op.type) {
      case 'spatial':
      case 'flash':
      case 'statistical':
      case 'market-making':
        return [op.pair];
      case 'triangular':
      case 'cross-triangular':
        return op.steps.map(step => step.pair);
      case 'pairs':
        return [op.pair1, op.pair2];
      default:
        return [];
    }
  };

  const getOpportunityRiskLevel = (op: AnyOpportunity): string => {
    if (op.type === 'market-making') {
      return op.riskLevel;
    }
    if (op.type === 'flash') {
      return op.urgency;
    }
    // تخمین سطح ریسک بر اساس سود
    const profit = getOpportunityProfit(op);
    if (profit > 2) return 'HIGH';
    if (profit > 0.5) return 'MEDIUM';
    return 'LOW';
  };

  const getRiskScore = (op: AnyOpportunity): number => {
    const riskLevel = getOpportunityRiskLevel(op);
    switch (riskLevel) {
      case 'LOW': return 1;
      case 'MEDIUM': return 2;
      case 'HIGH': return 3;
      default: return 2;
    }
  };

  const getConfidenceScore = (op: AnyOpportunity): number => {
    if (op.type === 'statistical' || op.type === 'pairs') {
      return op.confidence;
    }
    if (op.type === 'market-making') {
      return op.liquidityScore;
    }
    // تخمین اعتماد بر اساس نوع استراتژی
    switch (op.type) {
      case 'spatial': return 85;
      case 'triangular': return 75;
      case 'cross-triangular': return 65;
      case 'flash': return 60;
      default: return 70;
    }
  };

  // ذخیره فیلتر
  const saveFilter = (name: string) => {
    const newSavedFilters = { ...savedFilters, [name]: filters };
    setSavedFilters(newSavedFilters);
    localStorage.setItem('arbitrage-filters', JSON.stringify(newSavedFilters));
  };

  // بارگذاری فیلتر
  const loadFilter = (name: string) => {
    if (savedFilters[name]) {
      setFilters(savedFilters[name]);
    }
  };

  // حذف فیلتر
  const deleteFilter = (name: string) => {
    const newSavedFilters = { ...savedFilters };
    delete newSavedFilters[name];
    setSavedFilters(newSavedFilters);
    localStorage.setItem('arbitrage-filters', JSON.stringify(newSavedFilters));
  };

  // ریست فیلترها
  const resetFilters = () => {
    setFilters({
      strategyTypes: [],
      minProfit: 0,
      maxProfit: 100,
      exchanges: [],
      pairs: [],
      riskLevels: [],
      timeRange: {
        start: Date.now() - 3600000,
        end: Date.now()
      },
      sortBy: 'profit',
      sortOrder: 'desc'
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span>فیلترهای پیشرفته</span>
      </button>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">فیلترهای پیشرفته</h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* نوع استراتژی */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">نوع استراتژی</label>
          <div className="space-y-2">
            {['spatial', 'triangular', 'cross-triangular', 'statistical', 'flash', 'market-making', 'pairs'].map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.strategyTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters(prev => ({
                        ...prev,
                        strategyTypes: [...prev.strategyTypes, type]
                      }));
                    } else {
                      setFilters(prev => ({
                        ...prev,
                        strategyTypes: prev.strategyTypes.filter(t => t !== type)
                      }));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* محدوده سود */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">محدوده سود (%)</label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={filters.minProfit}
              onChange={(e) => setFilters(prev => ({ ...prev, minProfit: parseFloat(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>حداقل: {filters.minProfit.toFixed(1)}%</span>
              <span>حداکثر: {filters.maxProfit.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={filters.maxProfit}
              onChange={(e) => setFilters(prev => ({ ...prev, maxProfit: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>

        {/* صرافی‌ها */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">صرافی‌ها</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {SUPPORTED_CEXS.map(exchange => (
              <label key={exchange.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.exchanges.includes(exchange.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters(prev => ({
                        ...prev,
                        exchanges: [...prev.exchanges, exchange.id]
                      }));
                    } else {
                      setFilters(prev => ({
                        ...prev,
                        exchanges: prev.exchanges.filter(ex => ex !== exchange.id)
                      }));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">{exchange.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* مرتب‌سازی */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">مرتب‌سازی</label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="profit">سود</option>
            <option value="timestamp">زمان</option>
            <option value="risk">ریسک</option>
            <option value="confidence">اعتماد</option>
          </select>
          <div className="mt-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="sortOrder"
                value="desc"
                checked={filters.sortOrder === 'desc'}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">نزولی</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="sortOrder"
                value="asc"
                checked={filters.sortOrder === 'asc'}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">صعودی</span>
            </label>
          </div>
        </div>
      </div>

      {/* دکمه‌های عملیات */}
      <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-700">
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          ریست فیلترها
        </button>
        
        <button
          onClick={() => {
            const name = prompt('نام فیلتر را وارد کنید:');
            if (name) saveFilter(name);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          ذخیره فیلتر
        </button>

        {Object.keys(savedFilters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.keys(savedFilters).map(name => (
              <div key={name} className="flex items-center bg-gray-700 rounded-lg">
                <button
                  onClick={() => loadFilter(name)}
                  className="px-3 py-2 text-sm text-gray-300 hover:text-white"
                >
                  {name}
                </button>
                <button
                  onClick={() => deleteFilter(name)}
                  className="px-2 py-2 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedFilters;