import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useBalance } from './BalanceContext';
import { PaymentAPI } from '../services/api';

export type TokenPayment = {
  token_key: string;
  symbol: string;
  amount_to_pay: number;
};

export type Transaction = {
  payment_id: string;
  vendor_address: string;
  vendor_name: string;
  status: string;
  price_usd: number;
  created_at: number;
  payment_bundle: TokenPayment[];
  unsigned_transaction?: string;
  
  // Legacy fields for compatibility
  paymentId?: string;
  merchantId?: string;
  amount?: number;
  calculatedBundle?: TokenBreakdown[] | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TokenBreakdown = {
  tokenSymbol: string;
  amount: number;
};

interface TransactionContextType {
  // Merchant functions
  createTransaction: (amount: number) => Promise<string>;
  pollTransactionStatus: (paymentId: string) => void;
  stopPolling: () => void;
  
  // User functions
  scanTransaction: (paymentId: string) => Promise<Transaction>;
  supplementTransaction: (paymentId: string) => Promise<Transaction>;
  completeTransaction: (paymentId: string) => Promise<boolean>;
  
  // Shared state
  currentTransaction: Transaction | null;
  isLoading: boolean;
  clearTransaction: () => void;
  error: string | null;
}


export const TransactionContext = createContext<TransactionContextType>({ createTransaction: async () => '', pollTransactionStatus: () => {},
  stopPolling: () => {},
  scanTransaction: async () => ({} as Transaction),
  supplementTransaction: async () => ({} as Transaction),
  completeTransaction: async () => false,
  currentTransaction: null,
  isLoading: false,
  clearTransaction: () => {},
  error: null,
});

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const { balances } = useBalance();
  
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const handleError = (err: unknown, defaultMessage: string): never => {
    const errorMessage = err instanceof Error ? err.message : defaultMessage;
    setError(errorMessage);
    throw new Error(errorMessage);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearTimeout(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const clearTransaction = () => {
    setCurrentTransaction(null);
  };
  const createTransaction = async (amount: number): Promise<string> => {
    
    if (!auth?.walletAddress) {
      throw new Error('Vendor wallet address not available');
    }
    
    setIsLoading(true);
    
    try {
      // Prepare payment data for API
      const paymentData = {
        vendor_address: auth.walletAddress,
        vendor_name: auth.userName || 'Unknown Vendor',
        price_usd: amount,
        vendor_valuations: auth.valuations
      };
      
      
      // Call the real backend API
      const response = await PaymentAPI.createPayment(paymentData);
      
      // Use the response directly as our Transaction
      const transaction: Transaction = {
        payment_id: response.payment_id,
        vendor_address: auth.walletAddress,
        vendor_name: auth.userName || 'Unknown Vendor',
        status: response.status || 'Created',
        price_usd: amount,
        created_at: Date.now(),
        payment_bundle: [],
        
        // Legacy fields for compatibility
        paymentId: response.payment_id,
        merchantId: auth.walletAddress,
        amount: amount,
        calculatedBundle: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCurrentTransaction(transaction);
      return transaction.payment_id;
    } catch (err) {
      handleError(err, 'Failed to create transaction');
      throw err; // Re-throw to propagate the error after handling it
    } finally {
      setIsLoading(false);
    }
  };

  const pollTransactionStatus = (paymentId: string) => {
    stopPolling();
    
    let currentDelay = 1000;
    const maxDelay = 30000;
    const backoffMultiplier = 1.5;
    const maxAttempts = 50;
    let attemptCount = 0;
    
    
    const pollFunction = async () => {
      try {
        attemptCount++;
        
        // Call the actual backend API to get payment status
        const statusResponse = await PaymentAPI.getPaymentStatus(paymentId);
        
        // Update the current transaction with the latest data
        if (statusResponse) {
          const updatedTransaction = {
            ...currentTransaction,
            ...statusResponse,
            status: statusResponse.status,
            updatedAt: new Date().toISOString()
          };
          
          setCurrentTransaction(updatedTransaction);
          
          const completedStatuses = ['completed', 'success', 'confirmed', 'Completed', 'Success', 'Confirmed'];
          const failedStatuses = ['failed', 'cancelled', 'expired', 'Failed', 'Cancelled', 'Expired'];
          const terminalStatuses = [...completedStatuses, ...failedStatuses];
          
          if (terminalStatuses.includes(statusResponse.status)) {
            stopPolling();
            
            if (completedStatuses.includes(statusResponse.status)) {
            } else {
            }
            return; // Exit polling
          }
          
          if (currentTransaction && statusResponse.status !== currentTransaction.status) {
            currentDelay = 1000;
          } else {
            // No change, apply exponential backoff
            currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
          }
        }
        
        // Stop polling if we've reached max attempts
        if (attemptCount >= maxAttempts) {
          stopPolling();
          return;
        }
        
        // Schedule next poll
        const timeout = setTimeout(pollFunction, currentDelay);
        setPollingInterval(timeout as any);
        
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to poll transaction status';
        setError(errorMessage);
        
        // Check if it's a server error (5xx)
        if (err.response?.status >= 500 && err.response?.status < 600) {
          // For server errors, increase delay more aggressively
          currentDelay = Math.min(currentDelay * 3, maxDelay);
        } else {
          // For other errors, normal backoff
          currentDelay = Math.min(currentDelay * 2, maxDelay);
        }
        
        // Stop polling if too many errors or max attempts reached
        if (attemptCount >= maxAttempts || attemptCount >= 10) { // Stop after 10 attempts for errors
          stopPolling();
          
          setCurrentTransaction((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: 'error',
              error: 'Unable to get payment status'
            };
          });
          return;
        }
        
        // Schedule retry
        const timeout = setTimeout(pollFunction, currentDelay);
        setPollingInterval(timeout as any);
      }
    };
    
    // Start the first poll immediately
    pollFunction();
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearTimeout(pollingInterval);
      setPollingInterval(null);
    }
  };

  const scanTransaction = async (paymentId: string): Promise<Transaction> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to fetch payment from real API
      const payment = await PaymentAPI.getPayment(paymentId);
      
      // Use API response directly as our Transaction
      const transaction: Transaction = {
        // New fields from backend
        payment_id: payment.payment_id,
        vendor_address: payment.vendor_address,
        vendor_name: payment.vendor_name || 'Unknown Vendor',
        status: payment.status,
        price_usd: payment.price_usd,
        created_at: payment.created_at || Date.now(),
        payment_bundle: payment.payment_bundle || [],
        unsigned_transaction: payment.unsigned_transaction,
        
        // Legacy fields for compatibility
        paymentId: payment.payment_id,
        merchantId: payment.vendor_address,
        amount: payment.price_usd,
        calculatedBundle: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCurrentTransaction(transaction);
      return transaction;
    } catch (err) {
      handleError(err, 'Failed to scan transaction');
      throw err; // Re-throw to propagate the error after handling it
    } finally {
      setIsLoading(false);
    }
  };

  const supplementTransaction = async (paymentId: string): Promise<Transaction> => {
    if (!auth?.walletAddress) {
      throw new Error('User wallet address not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const payerBalances = balances.map(token => {
        const token_key = token.tokenKey || `${token.tokenSymbol},1`;
        
        return {
          token_key, // Using the stored token key from the TokenBalance
          symbol: token.tokenSymbol,
          name: token.tokenName,
          balance: token.amount,
          average_valuation: token.valueUSD / token.amount,
          token_image_url: token.logoUrl || null
        };
      });
      
      const transaction = await PaymentAPI.getFinalizedTransaction(paymentId, { 
        payer_address: auth.walletAddress,
        payer_balances: payerBalances
      });
      
      setCurrentTransaction(transaction);
      return transaction;
    } catch (err) {
      handleError(err, 'Failed to supplement transaction');
      throw err; // Re-throw to propagate the error after handling it
    } finally {
      setIsLoading(false);
    }
  };

  // User: Complete transaction
  const completeTransaction = async (paymentId: string): Promise<boolean> => {
    if (!auth?.walletAddress) {
      throw new Error('User wallet address not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API to complete the payment
      await PaymentAPI.completePayment(paymentId, {
        customer_address: auth.walletAddress
      });
      
      setCurrentTransaction(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'Completed',
        };
      });
      
      return true;
    } catch (err) {
      handleError(err, 'Failed to complete transaction');
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <TransactionContext.Provider
      value={{
        createTransaction,
        pollTransactionStatus,
        stopPolling,
        scanTransaction,
        supplementTransaction,
        completeTransaction,
        currentTransaction,
        isLoading,
        clearTransaction,
        error,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

// Custom hook to use the transaction context
export const useTransaction = () => useContext(TransactionContext);
