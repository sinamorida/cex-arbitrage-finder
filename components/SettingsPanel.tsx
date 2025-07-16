import React, { useState } from 'react';

interface SettingsPanelProps {
  onToggleRealData: (useRealData: boolean) => void;
  isUsingRealData: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onToggleRealData, isUsingRealData }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        title="Settings"
      >
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-xl z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Settings</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Data Source Toggle */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Data Source</label>
                <div className="flex items-center">
                  <button
                    onClick={() => onToggleRealData(!isUsingRealData)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isUsingRealData ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isUsingRealData ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {isUsingRealData ? (
                  <div>
                    <div className="flex items-center space-x-1 text-green-400 mb-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Live Data from Exchanges</span>
                    </div>
                    <p>Real-time market data from CEX APIs. May have rate limits and CORS issues.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-1 text-yellow-400 mb-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span>Simulated Data</span>
                    </div>
                    <p>Realistic mock data for demonstration. Always works without API limitations.</p>
                  </div>
                )}
              </div>
            </div>

            {/* API Status */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">API Status</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Binance</span>
                  <span className={`${isUsingRealData ? 'text-green-400' : 'text-gray-500'}`}>
                    {isUsingRealData ? 'Connected' : 'Simulated'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Kraken</span>
                  <span className={`${isUsingRealData ? 'text-green-400' : 'text-gray-500'}`}>
                    {isUsingRealData ? 'Connected' : 'Simulated'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Coinbase</span>
                  <span className={`${isUsingRealData ? 'text-green-400' : 'text-gray-500'}`}>
                    {isUsingRealData ? 'Connected' : 'Simulated'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">KuCoin</span>
                  <span className={`${isUsingRealData ? 'text-green-400' : 'text-gray-500'}`}>
                    {isUsingRealData ? 'Connected' : 'Simulated'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bybit</span>
                  <span className={`${isUsingRealData ? 'text-green-400' : 'text-gray-500'}`}>
                    {isUsingRealData ? 'Connected' : 'Simulated'}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning */}
            {isUsingRealData && (
              <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-xs text-yellow-300">
                    <p className="font-medium mb-1">Real API Mode</p>
                    <p>This may encounter CORS issues or rate limits. If data fails to load, it will automatically fallback to simulated data.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;