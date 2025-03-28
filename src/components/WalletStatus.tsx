import React from 'react';
import { Wallet, LogIn, LogOut } from 'lucide-react';

interface WalletStatusProps {
  isConnected: boolean;
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  chainId?: number;
}

export function WalletStatus({ isConnected, address, onConnect, onDisconnect, chainId }: WalletStatusProps) {
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

  // Show condensed address for small screens
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        className="flex items-center space-x-2 px-4 sm:px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-xs sm:text-sm"
      >
        <LogIn className="w-4 h-4" />
        <span className="font-medium">Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg text-xs sm:text-sm">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="font-medium text-gray-800 hidden sm:inline">Connected</span>
        {chainId && (
          <span className="text-xs text-gray-600 hidden md:inline">
            ({getNetworkName(chainId)})
          </span>
        )}
      </div>
      
      {address && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg text-xs sm:text-sm">
          <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
          <span className="font-medium text-gray-800">
            {formatAddress(address)}
          </span>
        </div>
      )}
      
      <button
        onClick={onDisconnect}
        className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-300 text-xs sm:text-sm"
      >
        <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="font-medium">Disconnect</span>
      </button>
    </div>
  );
}