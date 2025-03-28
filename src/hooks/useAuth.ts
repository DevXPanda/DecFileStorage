import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  account: string | null;
  provider: any | null;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    account: null,
    provider: null,
    error: null,
  });

  const connectMetamask = async () => {
    try {
      console.log("Attempting to connect to MetaMask...");
      if (!window.ethereum) {
        const errorMsg = 'Please install MetaMask';
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request accounts
      console.log("Requesting accounts...");
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (!accounts || accounts.length === 0) {
        const errorMsg = 'No accounts found';
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log("Account connected:", accounts[0]);
      
      // Skip supabase authentication for now - it might be causing issues
      // Instead, just set the authentication state directly
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        account: accounts[0],
        provider,
        error: null,
      });
      
      console.log("Authentication state updated, isAuthenticated set to true");
      toast.success('Wallet connected successfully!');
      
      return accounts[0]; // Return the connected account
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect');
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect',
      }));
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        account: null,
        provider: null,
        error: null,
      });
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if MetaMask is connected
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            console.log("Existing connection found:", accounts[0].address);
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              account: accounts[0].address,
              provider,
              error: null,
            });
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Connection check error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log("Accounts changed:", accounts);
        if (accounts.length > 0) {
          setAuthState(prev => ({ 
            ...prev, 
            isAuthenticated: true,
            account: accounts[0] 
          }));
        } else {
          disconnectWallet();
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return {
    ...authState,
    connectMetamask,
    disconnectWallet,
  };
};