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
  timeout: 10000,
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
   * Supplement a payment with payer address
   * @param paymentId Payment ID
   * @param supplementData Payment supplement data
   */
  supplementPayment: async (paymentId: string, supplementData: {
    payer_address: string;
  }) => {
    try {
      console.log(`Supplementing payment ${paymentId} with data:`, supplementData);
      const response = await api.post(`/api/payments/${paymentId}/supplement`, supplementData);
      console.log('Payment supplemented response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error supplementing payment:', error);
      throw error;
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
};

// Authentication interceptors
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global error responses
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.log('API Error:', error.response.status, error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // You might want to redirect to login or refresh token
      }
    } else if (error.request) {
      // Request was made but no response received
      console.log('Network Error:', error.request);
    } else {
      // Something else happened while setting up the request
      console.log('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
