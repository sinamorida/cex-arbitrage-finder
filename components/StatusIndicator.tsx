
import React from 'react';
import { DataStatus } from '../types';

interface StatusIndicatorProps {
  status: DataStatus;
  lastUpdated: number | null;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, lastUpdated }) => {
  const getStatusColorAndText = () => {
    switch (status) {
      case DataStatus.LOADING:
        return { color: 'bg-yellow-500', text: 'Updating...' };
      case DataStatus.SUCCESS:
        return { color: 'bg-green-500', text: 'Live' };
      case DataStatus.ERROR:
        return { color: 'bg-red-500', text: 'Error' };
      default:
        return { color: 'bg-gray-500', text: 'Idle' };
    }
  };

  const { color, text } = getStatusColorAndText();

  const timeAgo = (ts: number | null): string => {
    if (ts === null) return 'N/A';
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 2) return `just now`;
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="flex items-center space-x-2 text-sm p-2 bg-gray-800 rounded-lg shadow">
      <div className={`w-3 h-3 rounded-full ${color} ${status === DataStatus.LOADING ? 'animate-pulse' : ''}`}></div>
      <span className="text-gray-300 font-medium">
        {text}
      </span>
      {lastUpdated && status === DataStatus.SUCCESS && (
        <span className="text-gray-500">| Updated: {timeAgo(lastUpdated)}</span>
      )}
    </div>
  );
};

export default StatusIndicator;
