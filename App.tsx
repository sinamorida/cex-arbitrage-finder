import React, { useState, useEffect, useCallback } from 'react';
import { AnyOpportunity, DataStatus } from './types';
import { fetchAllOpportunities } from './services/blockchainDataService';
import Header from './components/Header';
import OpportunityList from './components/OpportunityList';
import StatusIndicator from './components/StatusIndicator';
import StrategyStats from './components/StrategyStats';
import { REFRESH_INTERVAL_MS, SUPPORTED_CEXS, PAIRS_TO_SCAN } from './constants';

const App: React.FC = () => {
  const [opportunities, setOpportunities] = useState<AnyOpportunity[]>([]);
  const [status, setStatus] = useState<DataStatus>(DataStatus.IDLE);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOpportunities = useCallback(async () => {
    setStatus(DataStatus.LOADING);
    setErrorMessage(null);
    try {
      const newOpportunities = await fetchAllOpportunities();
      setOpportunities(newOpportunities);
      setStatus(DataStatus.SUCCESS);
      setLastUpdated(Date.now());
    } catch (error: any) {
      console.error("Failed to fetch arbitrage opportunities:", error);
      setStatus(DataStatus.ERROR);
      setErrorMessage(error.message || "An unknown error occurred while fetching data from CEX APIs. This might be a CORS proxy issue or network problem.");
    } finally {
        if (isInitialLoad) setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: number;

    const runLoadCycle = async () => {
      if (!isMounted) return;
      await loadOpportunities();
      if (isMounted) {
        timeoutId = window.setTimeout(runLoadCycle, REFRESH_INTERVAL_MS);
      }
    };

    runLoadCycle();

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadOpportunities]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-semibold text-sky-400">Arbitrage Opportunities</h2>
          <StatusIndicator status={status} lastUpdated={lastUpdated} />
        </div>

        {isInitialLoad && status === DataStatus.LOADING && (
          <div className="text-center py-10">
            <p className="text-xl text-gray-400">Scanning for opportunities...</p>
            <p className="text-sm text-gray-500 mt-2">
                Checking {PAIRS_TO_SCAN.length} pairs across {SUPPORTED_CEXS.length} exchanges for spatial and triangular arbitrage.
            </p>
            <div className="mt-4 animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto"></div>
          </div>
        )}
        
        {status === DataStatus.ERROR && (
          <div className="text-center py-10 bg-red-900/20 p-6 rounded-lg">
            <p className="text-xl text-red-400">Error Loading Market Data</p>
            <p className="text-gray-400 mt-1">{errorMessage || "Could not fetch data. This could be due to API rate limits, network problems, or CORS proxy issues."}</p>
          </div>
        )}
        
        {!isInitialLoad && status !== DataStatus.ERROR && opportunities.length > 0 && (
          <>
            <StrategyStats opportunities={opportunities} />
            <OpportunityList opportunities={opportunities} />
          </>
        )}
        
        {!isInitialLoad && status === DataStatus.SUCCESS && opportunities.length === 0 && (
           <div className="text-center py-10 bg-gray-800 p-6 rounded-lg">
            <p className="text-xl text-gray-400">No significant arbitrage opportunities found.</p>
            <p className="text-sm text-gray-500 mt-1">Markets are currently efficient. Continuing to scan for new opportunities.</p>
          </div>
        )}
      </main>
      <footer className="text-center py-4 border-t border-gray-700 text-sm text-gray-500">
        <p>CEX Arbitrage Finder &copy; {new Date().getFullYear()}. Data from public CEX APIs via CCXT.</p>
        <p className="text-xs text-gray-600 mt-1">This tool is for educational purposes. Not financial advice. Profit calculations do not include trading, transfer, or network fees.</p>
      </footer>
    </div>
  );
};

export default App;
