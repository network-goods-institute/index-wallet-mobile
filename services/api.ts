import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { LOCAL_BACKEND_SERVER_URL } from '@/config';

// Get the API URL from environment variables
const API_URL = LOCAL_BACKEND_SERVER_URL || 'https://api.indexwallets.com';

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
   * Register a new user account
   * @param userData User registration data
   */
  registerUser: async (userData: {
    walletAddress: string;
    userType: 'vendor' | 'payee';
    deviceId: string;
    publicKey?: string;
    platformData?: {
      os: string;
      version: string;
      device: string;
    };
  }) => {
    try {
      const response = await api.post('/users/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

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
        // Handle unauthorized access
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
