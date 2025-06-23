import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PaymentAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { Transaction } from './TransactionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

// Polling intervals based on transaction age
const POLLING_INTERVALS = {
  ACTIVE_TRANSACTION: 2000,      // 2s - User actively transacting
  PENDING_RECENT: 5000,          // 5s - Transaction < 2 min old
  PENDING_STANDARD: 15000,       // 15s - Transaction 2-10 min old  
  PENDING_STALE: 60000,          // 60s - Transaction > 10 min old
  BACKGROUND_SYNC: 300000,       // 5 min - App in background
};

interface PendingTransactionManagerContextType {
  pendingTransactions: Transaction[];
  syncTransactions: () => Promise<void>;
  updateTransaction: (transaction: Transaction) => void;
  removePendingTransaction: (transactionId: string) => void;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;
}

// Storage keys are now functions that include wallet address
const getStorageKeys = (walletAddress: string) => ({
  PENDING_TRANSACTIONS: `@transactions/pending/${walletAddress}`,
  LAST_SYNC: `@transactions/last_sync/${walletAddress}`,
  CANCELLED_TRANSACTIONS: `@transactions/cancelled/${walletAddress}`,
});

export const PendingTransactionManagerContext = createContext<PendingTransactionManagerContextType>({
  pendingTransactions: [],
  syncTransactions: async () => {},
  updateTransaction: () => {},
  removePendingTransaction: () => {},
  isLoading: false,
  error: null,
  lastSyncTime: null,
});

export const PendingTransactionManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestCacheRef = useRef<Map<string, Promise<any>>>(new Map());
  const recentlyCancelledRef = useRef<Set<string>>(new Set());

  // Load cached data on mount and when wallet changes
  useEffect(() => {
    loadCachedData();
    loadCancelledTransactions();
    
    // App state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [auth?.walletAddress]); // Reload when wallet address changes

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    setAppState(nextAppState);
  };

  // Load cancelled transactions blacklist
  const loadCancelledTransactions = async () => {
    if (!auth?.walletAddress) return;
    
    try {
      const storageKeys = getStorageKeys(auth.walletAddress);
      const cancelled = await AsyncStorage.getItem(storageKeys.CANCELLED_TRANSACTIONS);
      if (cancelled) {
        const cancelledIds = JSON.parse(cancelled) as string[];
        recentlyCancelledRef.current = new Set(cancelledIds);
        // console.log(`Loaded ${cancelledIds.length} cancelled transaction IDs`);
      }
    } catch (error) {
      console.error('Failed to load cancelled transactions:', error);
    }
  };

  // Save cancelled transactions blacklist
  const saveCancelledTransactions = async () => {
    if (!auth?.walletAddress) return;
    
    try {
      const storageKeys = getStorageKeys(auth.walletAddress);
      const cancelledIds = Array.from(recentlyCancelledRef.current);
      await AsyncStorage.setItem(storageKeys.CANCELLED_TRANSACTIONS, JSON.stringify(cancelledIds));
    } catch (error) {
      console.error('Failed to save cancelled transactions:', error);
    }
  };

  // Load cached pending transactions
  const loadCachedData = async () => {
    if (!auth?.walletAddress) {
      // console.log('No wallet address, skipping cache load');
      return;
    }
    
    try {
      const storageKeys = getStorageKeys(auth.walletAddress);
      const [cachedPending, cachedLastSync] = await Promise.all([
        AsyncStorage.getItem(storageKeys.PENDING_TRANSACTIONS),
        AsyncStorage.getItem(storageKeys.LAST_SYNC),
      ]);

      if (cachedPending) {
        const transactions = JSON.parse(cachedPending);
        // Filter out recently cancelled transactions
        const filteredTransactions = transactions.filter((tx: Transaction) => 
          !recentlyCancelledRef.current.has(tx.payment_id)
        );
        // console.log(`Loaded ${filteredTransactions.length} cached transactions for wallet ${auth.walletAddress.slice(0, 8)}...`);
        setPendingTransactions(filteredTransactions);
      } else {
        // console.log('No cached transactions found for this wallet');
        setPendingTransactions([]);
      }
      
      if (cachedLastSync) {
        setLastSyncTime(parseInt(cachedLastSync, 10));
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
      setPendingTransactions([]);
    }
  };

  // Save to cache
  const saveToCache = async (transactions: Transaction[], syncTime: number) => {
    if (!auth?.walletAddress) {
      // console.log('No wallet address, skipping cache save');
      return;
    }
    
    try {
      const storageKeys = getStorageKeys(auth.walletAddress);
      // console.log(`Saving ${transactions.length} transactions to cache for wallet ${auth.walletAddress.slice(0, 8)}...`);
      await Promise.all([
        AsyncStorage.setItem(storageKeys.PENDING_TRANSACTIONS, JSON.stringify(transactions)),
        AsyncStorage.setItem(storageKeys.LAST_SYNC, syncTime.toString()),
      ]);
      // console.log('Cache saved successfully');
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  };

  // Calculate appropriate polling interval
  const calculatePollingInterval = useCallback((transactions: Transaction[]): number | null => {
    if (!transactions.length) return null;
    
    const now = Date.now();
    const ages = transactions.map(t => now - t.created_at);
    const newestAge = Math.min(...ages);
    
    // If app is in background, use background interval
    if (appState !== 'active') {
      return POLLING_INTERVALS.BACKGROUND_SYNC;
    }
    
    if (newestAge < 2 * 60 * 1000) return POLLING_INTERVALS.PENDING_RECENT;
    if (newestAge < 10 * 60 * 1000) return POLLING_INTERVALS.PENDING_STANDARD;
    return POLLING_INTERVALS.PENDING_STALE;
  }, [appState]);

  // Deduplicated request helper
  const dedupedRequest = async <T,>(key: string, requestFn: () => Promise<T>): Promise<T> => {
    const cache = requestCacheRef.current;
    
    if (cache.has(key)) {
      return cache.get(key) as Promise<T>;
    }
    
    const promise = requestFn();
    cache.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      cache.delete(key);
    }
  };

  // Main sync function
  const syncTransactions = useCallback(async () => {
    if (!auth?.walletAddress) return;
    
    const cacheKey = `sync-${auth.walletAddress}`;
    
    await dedupedRequest(cacheKey, async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // console.log('Syncing transactions from backend...');
        
        // Fetch transaction history from backend
        const response = await PaymentAPI.getTransactionHistory(auth.walletAddress);
        
        if (response && response.transactions) {
          // Filter for pending transactions
          const pendingStatuses = ['pending', 'created', 'assigned', 'Pending', 'Created', 'Assigned'];
          const pendingTxs = response.transactions.filter((tx: Transaction) => 
            pendingStatuses.includes(tx.status) && 
            !recentlyCancelledRef.current.has(tx.payment_id) // Exclude recently cancelled
          );
          
          // console.log(`Found ${pendingTxs.length} pending transactions from ${response.transactions.length} total`);
          
          // Update state with new pending transactions
          setPendingTransactions(pendingTxs);
          
          // Update last sync time
          const newSyncTime = Date.now();
          setLastSyncTime(newSyncTime);
          
          // Save to cache
          await saveToCache(pendingTxs, newSyncTime);
          
          // Update polling interval based on transaction ages
          const newInterval = calculatePollingInterval(pendingTxs);
          updatePollingInterval(newInterval);
          
          if (newInterval) {
            // console.log(`Polling interval updated to ${newInterval}ms based on transaction ages`);
          }
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Sync failed';
        setError(errorMessage);
        console.error('Transaction sync error:', err);
        
        // Fall back to cached data on error
        if (pendingTransactions.length === 0) {
          await loadCachedData();
        }
      } finally {
        setIsLoading(false);
      }
    });
  }, [auth?.walletAddress, lastSyncTime, calculatePollingInterval]);

  // Update polling interval
  const updatePollingInterval = useCallback((interval: number | null) => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    if (interval && appState === 'active') {
      // console.log(`Setting sync interval to ${interval}ms`);
      syncIntervalRef.current = setInterval(syncTransactions, interval);
    }
  }, [appState, syncTransactions]);

  // Start polling when pending transactions exist
  useEffect(() => {
    const interval = calculatePollingInterval(pendingTransactions);
    updatePollingInterval(interval);
  }, [pendingTransactions, calculatePollingInterval, updatePollingInterval]);

  // Update a specific transaction
  const updateTransaction = useCallback((transaction: Transaction) => {
    setPendingTransactions(prev => {
      // Check if transaction already exists
      const existingIndex = prev.findIndex(t => t.payment_id === transaction.payment_id);
      
      let updated;
      if (existingIndex >= 0) {
        // Update existing transaction
        updated = prev.map(t => 
          t.payment_id === transaction.payment_id ? transaction : t
        );
      } else {
        // Add new transaction
        updated = [...prev, transaction];
        // console.log('Added new pending transaction:', transaction.payment_id);
      }
      
      // Save to cache
      saveToCache(updated, lastSyncTime || Date.now());
      
      return updated;
    });
  }, [lastSyncTime]);

  // Remove completed/failed transaction from pending
  const removePendingTransaction = useCallback((transactionId: string) => {
    // Add to cancelled set permanently
    recentlyCancelledRef.current.add(transactionId);
    
    // Save to persistent storage
    saveCancelledTransactions();
    
    setPendingTransactions(prev => {
      const filtered = prev.filter(t => t.payment_id !== transactionId);
      
      // Save to cache
      saveToCache(filtered, lastSyncTime || Date.now());
      
      // Recalculate polling interval
      const newInterval = calculatePollingInterval(filtered);
      updatePollingInterval(newInterval);
      
      return filtered;
    });
  }, [lastSyncTime, calculatePollingInterval, updatePollingInterval]);

  return (
    <PendingTransactionManagerContext.Provider
      value={{
        pendingTransactions,
        syncTransactions,
        updateTransaction,
        removePendingTransaction,
        isLoading,
        error,
        lastSyncTime,
      }}
    >
      {children}
    </PendingTransactionManagerContext.Provider>
  );
};

export const usePendingTransactionManager = () => useContext(PendingTransactionManagerContext);