
import React from 'react';
import SettingsPanel from './SettingsPanel';

interface HeaderProps {
  onToggleRealData: (useRealData: boolean) => void;
  isUsingRealData: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleRealData, isUsingRealData }) => {
  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <h1 className="text-3xl font-bold text-sky-400 tracking-tight">
            CEX Arbitrage Finder
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Data Source Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isUsingRealData ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
            <span className="text-sm text-gray-300">
              {isUsingRealData ? 'Live Data' : 'Demo Mode'}
            </span>
          </div>
          
          <SettingsPanel 
            onToggleRealData={onToggleRealData}
            isUsingRealData={isUsingRealData}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
