import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PaymentAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useBalance } from './BalanceContext';
import { usePendingTransactionManager } from './PendingTransactionManager';
import { useTransactionHistory } from './TransactionHistoryStore';
import { Transaction } from './TransactionContext';

const POLLING_INTERVALS = {
  ACTIVE_TRANSACTION: 2000,  // 2s for active transactions
};

interface ActiveTransactionContextType {
  // Separate states for pay and receive flows
  activePayment: Transaction | null;
  activeRequest: Transaction | null;
  
  // Pay flow methods
  initiatePayment: (paymentCode: string) => Promise<Transaction>;
  completePayment: (paymentId: string) => Promise<boolean>;
  
  // Receive flow methods  
  createRequest: (amount: number) => Promise<string>;
  
  // Shared methods
  clearActivePayment: () => void;
  clearActiveRequest: () => void;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

export const ActiveTransactionContext = createContext<ActiveTransactionContextType>({
  activePayment: null,
  activeRequest: null,
  initiatePayment: async () => ({} as Transaction),
  completePayment: async () => false,
  createRequest: async () => '',
  clearActivePayment: () => {},
  clearActiveRequest: () => {},
  isLoading: false,
  error: null,
});

export const ActiveTransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const { balances, refreshBalances } = useBalance();
  const { updateTransaction, removePendingTransaction } = usePendingTransactionManager();
  const { addTransaction: addToHistory } = useTransactionHistory();
  
  const [activePayment, setActivePayment] = useState<Transaction | null>(null);
  const [activeRequest, setActiveRequest] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const paymentPollingRef = useRef<NodeJS.Timeout | null>(null);
  const requestPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (paymentPollingRef.current) {
        clearInterval(paymentPollingRef.current);
      }
      if (requestPollingRef.current) {
        clearInterval(requestPollingRef.current);
      }
    };
  }, []);

  // Check if status is terminal
  const isTerminalStatus = (status: string): boolean => {
    const terminalStatuses = [
      'completed', 'success', 'confirmed', 
      'failed', 'cancelled', 'expired',
      'Completed', 'Success', 'Confirmed',
      'Failed', 'Cancelled', 'Expired'
    ];
    return terminalStatuses.includes(status);
  };
  
  // Check if status is completed (not failed)
  const isCompletedStatus = (status: string): boolean => {
    const completedStatuses = [
      'completed', 'success', 'confirmed',
      'Completed', 'Success', 'Confirmed'
    ];
    return completedStatuses.includes(status);
  };

  // Poll specific transaction
  const pollTransaction = useCallback(async (
    transactionId: string, 
    type: 'payment' | 'request'
  ) => {
    try {
      const response = await PaymentAPI.getPaymentStatus(transactionId);
      
      if (response) {
        // Update the appropriate active transaction
        if (type === 'payment') {
          setActivePayment(prev => {
            if (prev?.payment_id !== transactionId) return prev;
            return { ...prev, ...response };
          });
        } else {
          setActiveRequest(prev => {
            if (prev?.payment_id !== transactionId) return prev;
            return { ...prev, ...response };
          });
        }
        
        // Update in pending manager
        updateTransaction(response);
        
        // Stop polling if terminal status
        if (isTerminalStatus(response.status)) {
          if (type === 'payment') {
            stopPaymentPolling();
          } else {
            stopRequestPolling();
          }
          
          // Only remove from pending if completed (not if failed/cancelled)
          if (isCompletedStatus(response.status)) {
            removePendingTransaction(transactionId);
            // Add to transaction history
            addToHistory(response);
            console.log('Transaction completed and added to history:', transactionId);
          }
        }
      }
    } catch (err) {
      console.error(`Failed to poll ${type} transaction:`, err);
    }
  }, [updateTransaction, removePendingTransaction]);

  // Start polling for payment
  const startPaymentPolling = useCallback((transactionId: string) => {
    stopPaymentPolling();
    
    // Initial poll
    pollTransaction(transactionId, 'payment');
    
    // Set up interval
    paymentPollingRef.current = setInterval(
      () => pollTransaction(transactionId, 'payment'),
      POLLING_INTERVALS.ACTIVE_TRANSACTION
    );
  }, [pollTransaction]);

  // Start polling for request
  const startRequestPolling = useCallback((transactionId: string) => {
    stopRequestPolling();
    
    // Initial poll
    pollTransaction(transactionId, 'request');
    
    // Set up interval
    requestPollingRef.current = setInterval(
      () => pollTransaction(transactionId, 'request'),
      POLLING_INTERVALS.ACTIVE_TRANSACTION
    );
  }, [pollTransaction]);

  // Stop polling
  const stopPaymentPolling = () => {
    if (paymentPollingRef.current) {
      clearInterval(paymentPollingRef.current);
      paymentPollingRef.current = null;
    }
  };

  const stopRequestPolling = () => {
    if (requestPollingRef.current) {
      clearInterval(requestPollingRef.current);
      requestPollingRef.current = null;
    }
  };

  // PAY FLOW: Initiate payment by scanning/entering code
  const initiatePayment = async (paymentCode: string): Promise<Transaction> => {
    if (!auth?.walletAddress) {
      throw new Error('Wallet address not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert balances to API format
      const payerBalances = balances.map(token => ({
        token_key: token.tokenKey || `${token.tokenSymbol},1`,
        symbol: token.tokenSymbol,
        name: token.tokenName,
        balance: token.amount,
        average_valuation: token.valueUSD / token.amount,
        token_image_url: token.logoUrl
      }));
      
      // Directly supplement the transaction with payer info
      const transaction = await PaymentAPI.getFinalizedTransaction(paymentCode, {
        payer_address: auth.walletAddress,
        payer_username: auth.userName || undefined,
        payer_balances: payerBalances
      });
      
      setActivePayment(transaction);
      
      // Start polling for updates
      startPaymentPolling(transaction.payment_id);
      
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // PAY FLOW: Complete the payment
  const completePayment = async (paymentId: string): Promise<boolean> => {
    if (!auth?.walletAddress) {
      throw new Error('Wallet address not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call API to complete payment
      const response = await PaymentAPI.completePayment(paymentId, {
        customer_address: auth.walletAddress
      });
      
      // Update active payment status
      setActivePayment(prev => {
        if (!prev || prev.payment_id !== paymentId) return prev;
        return { ...prev, status: 'Completed' };
      });
      
      // Refresh balances after payment
      await refreshBalances();
      
      // Stop polling
      stopPaymentPolling();
      
      // Remove from pending
      removePendingTransaction(paymentId);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // RECEIVE FLOW: Create payment request
  const createRequest = async (amount: number): Promise<string> => {
    if (!auth?.walletAddress) {
      throw new Error('Vendor wallet address not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const paymentData = {
        vendor_address: auth.walletAddress,
        vendor_name: auth.userName || 'Unknown Vendor',
        price_usd: amount,
        vendor_valuations: auth.valuations
      };
      
      const response = await PaymentAPI.createPayment(paymentData);
      
      const transaction: Transaction = {
        payment_id: response.payment_id,
        vendor_address: auth.walletAddress,
        vendor_name: auth.userName || 'Unknown Vendor',
        status: response.status || 'Created',
        price_usd: amount,
        created_at: Date.now(),
        payment_bundle: [],
      };
      
      setActiveRequest(transaction);
      
      // Add to pending transactions
      updateTransaction(transaction);
      
      // Start polling for updates
      startRequestPolling(transaction.payment_id);
      
      return transaction.payment_id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment request';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear methods
  const clearActivePayment = () => {
    stopPaymentPolling();
    setActivePayment(null);
  };

  const clearActiveRequest = () => {
    stopRequestPolling();
    setActiveRequest(null);
  };

  return (
    <ActiveTransactionContext.Provider
      value={{
        activePayment,
        activeRequest,
        initiatePayment,
        completePayment,
        createRequest,
        clearActivePayment,
        clearActiveRequest,
        isLoading,
        error,
      }}
    >
      {children}
    </ActiveTransactionContext.Provider>
  );
};

export const useActiveTransaction = () => useContext(ActiveTransactionContext);