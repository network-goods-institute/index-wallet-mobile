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

// API base URL - pointing to our local mock server
const API_BASE_URL = 'http://localhost:3000/api';

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
    console.log("Amount:", amount);
    console.log('User wallet address:', auth?.walletAddress);
    console.log('User name:', auth?.userName);
    console.log('User valuations:', auth?.valuations);
    
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
      console.log('Payment created:', response);
      
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
    
    console.log(`Starting polling for transaction: ${paymentId}`);
    
    const pollFunction = async () => {
      try {
        attemptCount++;
        console.log(`Polling attempt ${attemptCount} for transaction: ${paymentId} (delay: ${currentDelay}ms)`);
        
        // Call the actual backend API to get payment status
        const statusResponse = await PaymentAPI.getPaymentStatus(paymentId);
        console.log(`Received status response:`, statusResponse);
        
        // Update the current transaction with the latest data
        if (statusResponse) {
          const updatedTransaction = {
            ...currentTransaction,
            ...statusResponse,
            // Ensure we maintain both new and legacy field compatibility
            status: statusResponse.status,
            updatedAt: new Date().toISOString()
          };
          
          console.log(`Status updated to: ${statusResponse.status}`);
          setCurrentTransaction(updatedTransaction);
          
          // Check for terminal states (adjust these based on your backend's status values)
          const completedStatuses = ['completed', 'success', 'confirmed', 'Completed', 'Success', 'Confirmed'];
          const failedStatuses = ['failed', 'cancelled', 'expired', 'Failed', 'Cancelled', 'Expired'];
          const terminalStatuses = [...completedStatuses, ...failedStatuses];
          
          if (terminalStatuses.includes(statusResponse.status)) {
            stopPolling();
            console.log(`Stopped polling - terminal status reached: ${statusResponse.status}`);
            
            if (completedStatuses.includes(statusResponse.status)) {
              console.log('SUCCESS: Transaction completed successfully!');
            } else {
              console.log('FAILED: Transaction', statusResponse.status.toLowerCase(), '. Please try again.');
            }
            return; // Exit polling
          }
          
          // If status changed, reset delay to check more frequently
          if (currentTransaction && statusResponse.status !== currentTransaction.status) {
            console.log('Status changed, resetting polling delay');
            currentDelay = 1000;
          } else {
            // No change, apply exponential backoff
            currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
            console.log(`No status change, increasing delay to: ${currentDelay}ms`);
          }
        }
        
        // Stop polling if we've reached max attempts
        if (attemptCount >= maxAttempts) {
          stopPolling();
          console.log(`Stopped polling - reached maximum attempts (${maxAttempts})`);
          console.log('TIMEOUT: Transaction status polling timed out. Please check manually.');
          return;
        }
        
        // Schedule next poll
        const timeout = setTimeout(pollFunction, currentDelay);
        setPollingInterval(timeout as any);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to poll transaction status';
        setError(errorMessage);
        console.error('Polling error:', errorMessage);
        
        // On error, increase delay more aggressively
        currentDelay = Math.min(currentDelay * 2, maxDelay);
        console.log(`Error occurred, increasing delay to: ${currentDelay}ms`);
        
        // Stop polling if too many errors or max attempts reached
        if (attemptCount >= maxAttempts) {
          stopPolling();
          console.log('Stopped polling due to too many errors');
          console.log('ERROR: Unable to check transaction status. Please try again later.');
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
      console.log('Stopped polling manually');
    }
  };

  // User: Scan transaction from QR code
  const scanTransaction = async (paymentId: string): Promise<Transaction> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Scanning transaction: ${paymentId}`);
      
      try {
        // Try to fetch payment from real API
        const payment = await PaymentAPI.getPayment(paymentId);
        console.log('Payment details:', payment);
        
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
        console.log('API scan error, using mock:', apiError);
        
        // Fallback to mock implementation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create a mock transaction using the new structure
        const mockTransaction: Transaction = {
          // New fields
          payment_id: paymentId,
          vendor_address: 'mock-vendor-address',
          vendor_name: 'Mock Vendor',
          status: 'Created',
          price_usd: 10.00,
          created_at: Date.now(),
          payment_bundle: [],
          
          // Legacy fields
          paymentId,
          merchantId: 'mock-merchant-id',
          amount: 10.00,
          calculatedBundle: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setCurrentTransaction(mockTransaction);
        console.log('Transaction scanned (mock):', mockTransaction);
        return mockTransaction;
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
      console.log(`Supplementing transaction: ${paymentId}`);
      console.log('User info:', {
        walletAddress: auth.walletAddress,
        userName: auth.userName || 'Unknown User',
        hasValuations: auth.valuations,
        balancesCount: balances.length
      });
      
      // Convert balances to the format expected by the API, using the tokenKey from TokenBalance objects
      const payerBalances = balances.map(token => {
        // Use the tokenKey if available, otherwise fall back to constructing one from the symbol
        const token_key = token.tokenKey || `${token.tokenSymbol},1`;
        
        return {
          token_key, // Using the stored token key from the TokenBalance
          symbol: token.tokenSymbol,
          name: token.tokenName,
          balance: token.amount,
          average_valuation: token.valueUSD / token.amount, // Calculate average valuation
          token_image_url: token.logoUrl // Include the token image URL
        };
      });
      
      console.log('Sending balances to API with token keys:', payerBalances);
      
      const transaction = await PaymentAPI.getFinalizedTransaction(paymentId, { 
        payer_address: auth.walletAddress,
        payer_balances: payerBalances
      });
      
      console.log('Transaction from API:', transaction);
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
      console.log(`Completing transaction: ${paymentId}`);
      
      let signature = null;
      if (auth.signMessage) {
        const message = `Complete transaction ${paymentId}`;
        signature = await auth.signMessage(message);
        console.log(`Transaction signed with message: ${message}`);
      }
      
      console.log('Completion data:', {
        signature,
        walletAddress: auth.walletAddress
      });
      
      // Call the API to complete the payment
      const response = await PaymentAPI.completePayment(paymentId, {
        customer_address: auth.walletAddress
      });
      
      console.log('Payment completion response:', response);
      
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
      
      console.log('Transaction completed successfully');
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
