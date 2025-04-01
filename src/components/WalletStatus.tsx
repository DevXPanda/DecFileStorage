import React from 'react';
import { Wallet, LogIn, LogOut } from 'lucide-react';

interface WalletStatusProps {
  isConnected: boolean;
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  chainId?: number;
}

export const WalletStatus: React.FC<WalletStatusProps> = ({ isConnected, address, onConnect, onDisconnect, chainId }) => {
  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 5:
        return 'Goerli Testnet';
      case 137:
        return 'Polygon Mainnet';
      case 80001:
        return 'Mumbai Testnet';
      default:
        return 'Unknown Network';
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected || !address) {
    return (
      <button
        onClick={onConnect}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full hover:from-violet-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30 text-sm font-medium w-full sm:w-auto justify-center"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/20 hover:shadow-md transition-all duration-300 w-full sm:w-auto">
      <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0"></div>
        <span className="text-sm text-gray-700 font-medium truncate">
          {truncateAddress(address)}
          {chainId && (
            <span className="hidden sm:inline text-gray-500 ml-1">
              ({getNetworkName(chainId)})
            </span>
          )}
        </span>
      </div>
      <div className="h-4 w-px bg-gray-200 shrink-0"></div>
      <button
        onClick={onDisconnect}
        className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors whitespace-nowrap"
      >
        Disconnect
      </button>
    </div>
  );
};