import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from '../config';

// Get the API URL from our config file

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Platform': Platform.OS,
    'X-Client-Version': Constants.expoConfig?.version || '1.0.0',
  },
  timeout: 30000, // Increased timeout for mobile networks
});


// User account API functions
export const UserAPI = {
  /**
   * Sign in to an existing user account
   * @param credentials User credentials
   */
  /**
   * Register a new user account
   * @param userData User registration data
   */
  // registerUser: async (userData: {
  //   walletAddress: string;
  //   userType: 'vendor' | 'payee';
  //   deviceId: string;
  //   publicKey?: string;
  //   platformData?: {
  //     os: string;
  //     version: string;
  //     device: string;
  //   };
  // }) => {
  //   try {
  //     const response = await api.post('/users/register', userData);
  //     return response.data;
  //   } catch (error: any) {
  //     console.error('Error registering user:', error);
      
  //     if (error.response) {
  //       console.error('Error response data:', error.response.data);
  //       console.error('Error response status:', error.response.status);
        
  //       // Handle specific error codes
  //       if (error.response.status === 409) {
  //         // 409 Conflict - User or wallet already exists
  //         const message = error.response.data.message || 'A user with this wallet address already exists';
  //         throw new Error(message);
  //       } else if (error.response.status === 400) {
  //         // 400 Bad Request - Invalid data
  //         const message = error.response.data.message || 'Invalid registration data';
  //         throw new Error(message);
  //       } else if (error.response.status === 500) {
  //         // 500 Server Error
  //         throw new Error('Server error occurred. Please try again later.');
  //       }
  //     } else if (error.request) {
  //       // The request was made but no response was received
  //       throw new Error('No response received from server. Please check your connection.');
  //     }
      
  //     // For other errors, throw the original error
  //     throw error;
  //   }
  // },

  /**
   * Verify wallet ownership by signing a message
   * @param walletAddress Wallet address
   * @param signature Signed message
   */
  verifyWallet: async (walletAddress: string, signature: string) => {
    try {
      const response = await api.post('/users/verify-wallet', {
        walletAddress,
        signature,
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying wallet:', error);
      throw error;
    }
  },

  /**
   * Update user profile information
   * @param userId User ID
   * @param profileData Profile data to update
   */
  updateProfile: async (userId: string, profileData: any) => {
    try {
      const response = await api.put(`/users/${userId}/profile`, profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
};

// Wallet API functions
export const WalletAPI = {

  /**
   * Register a new wallet
   * @param walletData Wallet registration data
   */
  registerWallet: async (walletData: {
    walletAddress: string;
    userId: string;
    walletType: 'primary' | 'secondary';
    isBackedUp: boolean;
    hasBiometrics: boolean;
  }) => {
    try {
      const response = await api.post('/wallets/register', walletData);
      return response.data;
    } catch (error) {
      console.error('Error registering wallet:', error);
      throw error;
    }
  },

  /**
   * Get wallet balance
   * @param walletAddress Wallet address
   */
  getBalance: async (walletAddress: string) => {
    try {
      const response = await api.get(`/wallets/${walletAddress}/balance`);
      return response.data;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  },
};

// Payment API functions
export const PaymentAPI = {
  /**
   * Create a new payment request (vendor)
   * @param paymentData Payment creation data
   */
  createPayment: async (paymentData: {
    vendor_address: string;
    vendor_name: string;
    price_usd: number;
    vendor_valuations: any; 
  }) => {
    try {
      console.log('Creating payment with data:', paymentData);
      
      // Send the data as is, with price_usd as a number
      const response = await api.post('/api/payments', paymentData);
      console.log('Payment created response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  /**
   * Get payment details by ID
   * @param paymentId Payment ID
   */
  getPayment: async (paymentId: string) => {
    try {
      const response = await api.get(`/api/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment:', error);
      throw error;
    }
  },

  /**
   * Supplement a payment with payer address and token balances
   * @param paymentId Payment ID
   * @param supplementData Payment supplement data including token balances
   */
  getFinalizedTransaction: async (paymentId: string, supplementData: {
    payer_address: string;
    payer_username?: string;
    payer_balances: Array<{
      token_key: string;     // "address,chainId"
      symbol: string;
      name: string;
      balance: number;
      average_valuation: number;
    }>;
  }) => {
    try {
      console.log(`Supplementing payment ${paymentId} with data:`, supplementData);
      const response = await api.post(`/api/payments/${paymentId}/supplement`, supplementData);
      console.log('Payment supplemented response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error supplementing payment:', error);
      
      // Handle specific error cases
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400 && data?.code === 'VALIDATION_ERROR') {
          // Extract the specific validation error message
          const message = data.message || 'Validation error';
          
          if (message.includes('Insufficient funds')) {
            throw new Error('INSUFFICIENT_FUNDS');
          } else if (message.includes('Payment code not found')) {
            throw new Error('PAYMENT_NOT_FOUND');
          } else if (message.includes('Transaction already fulfilled')) {
            throw new Error('PAYMENT_ALREADY_COMPLETED');
          } else if (message.includes('Payer already assigned')) {
            throw new Error('PAYMENT_ALREADY_ASSIGNED');
          } else {
            throw new Error(message);
          }
        } else if (status === 404 && data?.code === 'NOT_FOUND') {
          const message = data.message || 'Not found';
          // Check if it's a payment not found error
          if (message.includes('Payment with ID') && message.includes('not found')) {
            throw new Error('PAYMENT_NOT_FOUND');
          } else {
            throw new Error('USER_NOT_FOUND');
          }
        } else if (status === 500) {
          throw new Error('SERVER_ERROR');
        }
      }
      
      // Generic error
      throw new Error('Failed to process payment');
    }
  },

  /**
   * Get payment status
   * @param paymentId Payment ID
   */
  getPaymentStatus: async (paymentId: string) => {
    try {
      const response = await api.get(`/api/payments/${paymentId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  },

  /**
   * Complete a payment (customer)
   * @param paymentId Payment ID
   * @param completeData Payment completion data
   */
  completePayment: async (paymentId: string, completeData: {
    customer_address: string;
  }) => {
    try {
      const response = await api.post(`/api/payments/${paymentId}/complete`, completeData);
      return response.data;
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  },


  /**
   * Sync transactions (pending and recent)
   * @param params Sync parameters
   */
  syncTransactions: async (params: {
    wallet_address: string;
    include_pending: boolean;
    include_recent: boolean;
    if_modified_since?: number;
  }) => {
    try {
      const response = await api.get('/api/transactions/sync', { params });
      return response.data;
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw error;
    }
  },

  /**
   * Get transaction history for a user
   * @param userAddress The wallet address of the user
   */
  getTransactionHistory: async (userAddress: string) => {
    try {
      const response = await api.get(`/api/users/${userAddress}/transactions`);
      return response.data;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  },

  /**
   * Delete/Cancel a payment request (vendor only)
   * @param paymentId Payment ID to delete
   * @param vendorAddress Vendor's wallet address
   */
  deletePayment: async (paymentId: string, vendorAddress: string) => {
    try {
      const response = await api.delete(`/api/payments/${paymentId}`, {
        data: {
          vendor_address: vendorAddress
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },

  /**
   * Batch check status for multiple transactions
   * @param transactionIds Array of transaction IDs
   */
  batchCheckStatus: async (transactionIds: string[]) => {
    try {
      const response = await api.post('/api/transactions/batch-status', { 
        transaction_ids: transactionIds 
      });
      return response.data;
    } catch (error) {
      console.error('Error batch checking status:', error);
      throw error;
    }
  },
};

// Authentication interceptors
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Making API request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      timeout: config.timeout
    });
    return config;
  },
  (error) => {
    console.error('❌ Request setup error:', error);
    return Promise.reject(error);
  }
);

// Error handling interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API response received:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error Details:', {
      message: error.message,
      code: error.code,
      request: error.request ? 'Request made' : 'No request',
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response received',
      config: {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown URL'
      }
    });
    
    // Handle global error responses
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.log('Server Error Response:', error.response.status, error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // You might want to redirect to login or refresh token
      }
    } else if (error.request) {
      // Request was made but no response received
      console.log('Network/Request Error - no response received');
      console.log('Request details:', {
        url: error.config?.baseURL + error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    } else {
      // Something else happened while setting up the request
      console.log('Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
