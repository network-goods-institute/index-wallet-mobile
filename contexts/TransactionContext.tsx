import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { PaymentAPI } from '@/services/api';

// Define transaction status types
export type TransactionStatus = 'pending' | 'calculated' | 'confirmed' | 'failed';

// Define transaction bundle type
export type TokenBreakdown = {
  tokenSymbol: string;
  amount: number;
};

// Define transaction type
export type Transaction = {
  paymentId: string;
  merchantId: string;
  amount: number;
  status: TransactionStatus;
  calculatedBundle: TokenBreakdown[] | null;
  createdAt: string;
  updatedAt: string;
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
  // Get user data from AuthContext
  const auth = useAuth();
  
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [pollingDelay, setPollingDelay] = useState<number>(1000); // Start with 1 second

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
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
      
      console.log('Sending payment data to API:', paymentData);
      
      // Call the real backend API
      const response = await PaymentAPI.createPayment(paymentData);
      console.log('Payment created:', response);
      
      // Convert the response to our Transaction format
      const transaction: any = {
        paymentId: response.payment_id,
        merchantId: auth.walletAddress,
        amount: amount,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCurrentTransaction(transaction);
      return transaction.paymentId;
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
    
    // Set initial polling delay
    setPollingDelay(1000);
    
    // Start polling
    const interval = setInterval(async () => {
      try {
        console.log(`Polling status for transaction: ${paymentId}`);
        
        if (currentTransaction) {
          const updatedStatus = Math.random() > 0.7 
            ? (currentTransaction.status === 'pending' ? 'calculated' : 'confirmed') 
            : currentTransaction.status;
          
          const updatedTransaction = {
            ...currentTransaction,
            status: updatedStatus as TransactionStatus,
            updatedAt: new Date().toISOString()
          };
          
          console.log(`Status updated: ${currentTransaction.status} -> ${updatedStatus}`);
          setCurrentTransaction(updatedTransaction);
          
          if (updatedStatus !== currentTransaction.status) {
            setPollingDelay(1000);
            console.log('Status changed, resetting polling delay');
          } else {
            setPollingDelay(prev => Math.min(prev * 1.5, 5000));
            console.log(`Increasing polling delay to: ${Math.min(pollingDelay * 1.5, 5000)}ms`);
          }
          
          if (updatedStatus === 'confirmed' || updatedStatus === 'failed') {
            stopPolling();
            console.log(`Stopped polling - final status: ${updatedStatus}`);
            
            if (updatedStatus === 'confirmed') {
              Alert.alert('Success', 'Transaction completed successfully!');
            } else {
              Alert.alert('Failed', 'Transaction failed. Please try again.');
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to poll transaction status';
        setError(errorMessage);
        console.error('Polling error:', errorMessage);
        setPollingDelay(prev => Math.min(prev * 2, 5000));
      }
    }, pollingDelay);
    
    setPollingInterval(interval);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
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
        // Try to get payment from real API
        const payment = await PaymentAPI.getPayment(paymentId);
        console.log('Payment details from API:', payment);
        
        // Map API data to our Transaction type
        const transaction: Transaction = {
          paymentId: payment.payment_id,
          merchantId: payment.vendor_address,
          amount: payment.price_usd,
          status: payment.status === 'Completed' ? 'confirmed' : 
                 payment.status === 'Failed' ? 'failed' : 'pending',
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
        
        const mockTransaction = {
          paymentId,
          merchantId: 'mock-merchant-id',
          amount: 10.00,
          status: 'pending' as TransactionStatus,
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

  // User: Supplement transaction with wallet address
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
        hasValuations: auth.valuations 
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const transaction = await PaymentAPI.getFinalizedTransaction(paymentId, { payer_address: auth.walletAddress })
      console.log(transaction + "Transaction from Context")
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
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentTransaction(prev => prev ? { ...prev, status: 'confirmed' } : null);
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
