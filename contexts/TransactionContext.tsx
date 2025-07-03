import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useBalance } from './BalanceContext';
import { PaymentAPI } from '../services/api';

// Define transaction status types
export type TransactionStatus = 'pending' | 'calculated' | 'confirmed' | 'failed';

// Define token payment type for the payment bundle
export type TokenPayment = {
  token_key: string;
  symbol: string;
  amount_to_pay: number;
};

// Define transaction type to match backend SupplementPaymentResponse
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

// Legacy type for backward compatibility
export type TokenBreakdown = {
  tokenSymbol: string;
  amount: number;
};

// Context interface
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


// Create context with default values
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
  // Get user data from AuthContext and BalanceContext
  const auth = useAuth();
  const { balances } = useBalance();
  
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearTimeout(pollingInterval); // Changed to clearTimeout since we're using setTimeout
      }
    };
  }, [pollingInterval]);

  const clearTransaction = () => {
    setCurrentTransaction(null);
  };
  // Merchant: Create a new transaction
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
      // console.log('Payment created:', response);
      
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
      console.error('API call error:', err);
      
      // Fallback to mock implementation if API call fails
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Merchant: Poll transaction status with exponential backoff
  const pollTransactionStatus = (paymentId: string) => {
    // Clear any existing polling
    stopPolling();
    
    // Initialize polling state
    let currentDelay = 1000; // Start with 1 second
    const maxDelay = 30000; // Maximum 30 seconds
    const backoffMultiplier = 1.5; // Exponential backoff factor
    const maxAttempts = 50; // Stop after 50 attempts
    let attemptCount = 0;
    
    // console.log(`Starting polling for transaction: ${paymentId}`);
    
    const pollFunction = async () => {
      try {
        attemptCount++;
        // console.log(`Polling attempt ${attemptCount} for transaction: ${paymentId} (delay: ${currentDelay}ms)`);
        
        // Call the actual backend API to get payment status
        const statusResponse = await PaymentAPI.getPaymentStatus(paymentId);
        // console.log(`Received status response:`, statusResponse);
        
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
        console.error('Polling error:', errorMessage);
        
        // Check if it's a server error (5xx)
        if (err.response?.status >= 500 && err.response?.status < 600) {
          console.error('Server error detected, will retry with longer delay');
          // For server errors, increase delay more aggressively
          currentDelay = Math.min(currentDelay * 3, maxDelay);
        } else {
          // For other errors, normal backoff
          currentDelay = Math.min(currentDelay * 2, maxDelay);
        }
        // console.log(`Error occurred, increasing delay to: ${currentDelay}ms`);
        
        // Stop polling if too many errors or max attempts reached
        if (attemptCount >= maxAttempts || attemptCount >= 10) { // Stop after 10 attempts for errors
          stopPolling();
          
          setCurrentTransaction((prev: any) => {
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

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearTimeout(pollingInterval); // Changed to clearTimeout
      setPollingInterval(null);
    }
  };

  // User: Scan transaction from QR code
  const scanTransaction = async (paymentId: string): Promise<Transaction> => {
    setIsLoading(true);
    setError(null);
    
    try {
      
      try {
        // Try to fetch payment from real API
        const payment = await PaymentAPI.getPayment(paymentId);
        // console.log('Payment details:', payment);
        
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
      } catch (apiError) {
        const errorMessage = apiError instanceof Error ? apiError.message : 'Failed to scan transaction';
        setError(errorMessage); 
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan transaction';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // User: Supplement transaction with wallet address and token balances
  const supplementTransaction = async (paymentId: string): Promise<Transaction> => {
    if (!auth?.walletAddress) {
      throw new Error('User wallet address not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // console.log(`Supplementing transaction: ${paymentId}`);
      // console.log('User info:', {
      //   walletAddress: auth.walletAddress,
      //   userName: auth.userName || 'Unknown User',
      //   hasValuations: auth.valuations,
      //   balancesCount: balances.length
      // });
      
      // Convert balances to the format expected by the API
      const payerBalances = balances.map(token => {
        // Use the tokenKey if available, otherwise fall back to constructing one from the symbol
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
      
      // console.log('Sending balances to API with token keys:', payerBalances);
      
      const transaction = await PaymentAPI.getFinalizedTransaction(paymentId, { 
        payer_address: auth.walletAddress,
        payer_balances: payerBalances
      });
      
      // console.log('==========================================');
      // console.log('TRANSACTION RECEIVED FROM API:');
      // console.log('==========================================');
      // console.log(JSON.stringify(transaction, null, 2));
      // console.log('==========================================');
      // console.log('Setting as currentTransaction...');
      setCurrentTransaction(transaction);
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to supplement transaction';
      setError(errorMessage);
      throw new Error(errorMessage);
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
      // console.log(`Completing transaction: ${paymentId}`);
      
      let signature = null;
      if (auth.signMessage) {
        const message = `Complete transaction ${paymentId}`;
        signature = await auth.signMessage(message);
        // console.log(`Transaction signed with message: ${message}`);
      }
      
      // console.log('Completion data:', {
      //   signature,
      //   walletAddress: auth.walletAddress
      // });
      
      // Call the API to complete the payment
      const response = await PaymentAPI.completePayment(paymentId, {
        customer_address: auth.walletAddress
      });
      
      // console.log('Payment completion response:', response);
      
      // Update the transaction status in state
      setCurrentTransaction(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'Completed',
          // Also update legacy status field
          ...(prev.status && { status: 'Completed' })
        };
      });
      
      // console.log('Transaction completed successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete transaction';
      setError(errorMessage);
      throw new Error(errorMessage);
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
