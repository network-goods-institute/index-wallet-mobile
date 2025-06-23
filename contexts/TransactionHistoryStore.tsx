import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaymentAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { Transaction } from './TransactionContext';

// Storage keys are now functions that include wallet address
const getStorageKeys = (walletAddress: string) => ({
  TRANSACTION_HISTORY: `@transactions/history/${walletAddress}`,
  HISTORY_CURSOR: `@transactions/history_cursor/${walletAddress}`,
});

const MAX_CACHED_TRANSACTIONS = 100;
const PAGE_SIZE = 50;

interface TransactionHistoryStoreContextType {
  transactions: Transaction[];
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  
  loadTransactionHistory: () => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  addTransaction: (transaction: Transaction) => void;
}

export const TransactionHistoryStoreContext = createContext<TransactionHistoryStoreContextType>({
  transactions: [],
  hasMore: true,
  isLoading: false,
  error: null,
  loadTransactionHistory: async () => {},
  loadMoreTransactions: async () => {},
  refreshHistory: async () => {},
  addTransaction: () => {},
});

export const TransactionHistoryStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cached history on mount and when wallet changes
  useEffect(() => {
    if (auth?.walletAddress && !isInitialized) {
      loadCachedHistory();
      setIsInitialized(true);
    }
  }, [auth?.walletAddress, isInitialized]);
  
  // Reset when wallet changes
  useEffect(() => {
    setIsInitialized(false);
    setTransactions([]);
    setCursor(null);
    setHasMore(true);
  }, [auth?.walletAddress]);

  // Clear transaction history when user logs out
  useEffect(() => {
    if (auth?.status === 'unauthenticated') {
      setTransactions([]);
      setCursor(null);
      setHasMore(true);
      setError(null);
      setIsLoading(false);
      setIsInitialized(false);
    }
  }, [auth?.status]);

  // Load cached transaction history
  const loadCachedHistory = async () => {
    if (!auth?.walletAddress) {
      console.log('No wallet address, skipping history cache load');
      return;
    }
    
    try {
      const storageKeys = getStorageKeys(auth.walletAddress);
      const [cachedHistory, cachedCursor] = await Promise.all([
        AsyncStorage.getItem(storageKeys.TRANSACTION_HISTORY),
        AsyncStorage.getItem(storageKeys.HISTORY_CURSOR),
      ]);

      if (cachedHistory) {
        const parsed = JSON.parse(cachedHistory);
        console.log(`Loaded ${parsed.length} cached history transactions for wallet ${auth.walletAddress.slice(0, 8)}...`);
        setTransactions(parsed);
      } else {
        console.log('No cached transaction history found for this wallet');
        setTransactions([]);
      }
      
      if (cachedCursor) {
        setCursor(cachedCursor);
      }
    } catch (error) {
      console.error('Failed to load cached history:', error);
      setTransactions([]);
    }
  };

  // Save to cache
  const saveToCache = async (txns: Transaction[], newCursor: string | null) => {
    if (!auth?.walletAddress) {
      console.log('No wallet address, skipping history cache save');
      return;
    }
    
    try {
      const storageKeys = getStorageKeys(auth.walletAddress);
      // Prune old transactions if exceeding limit
      const pruned = txns.slice(0, MAX_CACHED_TRANSACTIONS);
      
      console.log(`Saving ${pruned.length} history transactions to cache for wallet ${auth.walletAddress.slice(0, 8)}...`);
      
      await Promise.all([
        AsyncStorage.setItem(storageKeys.TRANSACTION_HISTORY, JSON.stringify(pruned)),
        newCursor 
          ? AsyncStorage.setItem(storageKeys.HISTORY_CURSOR, newCursor)
          : AsyncStorage.removeItem(storageKeys.HISTORY_CURSOR),
      ]);
    } catch (error) {
      console.error('Failed to save history to cache:', error);
    }
  };

  // Load initial transaction history
  const loadTransactionHistory = useCallback(async () => {
    if (!auth?.walletAddress || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await PaymentAPI.getTransactionHistory(auth.walletAddress);
      
      const newTransactions = response.transactions || [];
      const newCursor = response.cursor || null;
      
      setTransactions(newTransactions);
      setCursor(newCursor);
      setHasMore(!!newCursor);
      
      // Save to cache
      await saveToCache(newTransactions, newCursor);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transaction history';
      setError(errorMessage);
      console.error('Load history error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [auth?.walletAddress, isLoading]);

  // Load more transactions (pagination)
  const loadMoreTransactions = useCallback(async () => {
    if (!auth?.walletAddress || !cursor || isLoading || !hasMore) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await PaymentAPI.getTransactionHistory({
        wallet_address: auth.walletAddress,
        limit: PAGE_SIZE,
        cursor: cursor,
      });
      
      const newTransactions = response.transactions || [];
      const newCursor = response.cursor || null;
      
      // Append to existing transactions
      const combined = [...transactions, ...newTransactions];
      
      setTransactions(combined);
      setCursor(newCursor);
      setHasMore(!!newCursor);
      
      // Save to cache
      await saveToCache(combined, newCursor);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more transactions';
      setError(errorMessage);
      console.error('Load more error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [auth?.walletAddress, cursor, isLoading, hasMore, transactions]);

  // Refresh history (pull to refresh)
  const refreshHistory = useCallback(async () => {
    setCursor(null);
    setHasMore(true);
    await loadTransactionHistory();
  }, [loadTransactionHistory]);

  // Add a new transaction to history (when completed)
  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => {
      // Check if transaction already exists
      const exists = prev.some(t => t.payment_id === transaction.payment_id);
      if (exists) {
        // Update existing transaction
        return prev.map(t => 
          t.payment_id === transaction.payment_id ? transaction : t
        );
      } else {
        // Add new transaction at the beginning
        const updated = [transaction, ...prev];
        
        // Save to cache in background
        saveToCache(updated, cursor);
        
        return updated;
      }
    });
  }, [cursor]);

  // Clear cache when user changes
  useEffect(() => {
    if (!auth?.walletAddress && isInitialized) {
      setTransactions([]);
      setCursor(null);
      setHasMore(true);
      setIsInitialized(false);
      
      // Clear cache
      AsyncStorage.multiRemove([
        STORAGE_KEYS.TRANSACTION_HISTORY,
        STORAGE_KEYS.HISTORY_CURSOR,
      ]);
    }
  }, [auth?.walletAddress, isInitialized]);

  return (
    <TransactionHistoryStoreContext.Provider
      value={{
        transactions,
        hasMore,
        isLoading,
        error,
        loadTransactionHistory,
        loadMoreTransactions,
        refreshHistory,
        addTransaction,
      }}
    >
      {children}
    </TransactionHistoryStoreContext.Provider>
  );
};

export const useTransactionHistory = () => useContext(TransactionHistoryStoreContext);