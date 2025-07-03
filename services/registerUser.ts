import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from '../config';

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

// User registration API
export const registerUser = async (userData: {
  walletAddress: string;
  username: string;
  userType?: 'vendor' | 'customer';
  preferences?: any;
  isVerified?: boolean;
  vendorDescription?: string;
  vendorGoogleMapsLink?: string;
  vendorWebsiteLink?: string;
} = {
  walletAddress: '',
  username: '',
  userType: 'customer',
  isVerified: true,
}) => {
  try {
    // Convert camelCase to snake_case for the Rust backend
    const backendData: any = {
      wallet_address: userData.walletAddress,
      username: userData.username,
      user_type: userData.userType || 'customer',
      is_verified: userData.isVerified || true,
    };

    // Add optional fields if provided
    if (userData.preferences !== undefined) {
      backendData.preferences = userData.preferences;
    }

    // Add vendor-specific fields only if user type is vendor
    if (userData.userType === 'vendor') {
      if (userData.vendorDescription !== undefined) {
        backendData.vendor_description = userData.vendorDescription;
      }
      if (userData.vendorGoogleMapsLink !== undefined) {
        backendData.vendor_google_maps_link = userData.vendorGoogleMapsLink;
      }
      if (userData.vendorWebsiteLink !== undefined) {
        backendData.vendor_website_link = userData.vendorWebsiteLink;
      }
    }

    const response = await api.post('/api/users', backendData);
    return response.data;
  } catch (error: any) {
    // console.error('Error registering user:', error.response?.data || error.message);
    throw error;
  }
};


// Wallet API functions
export const registerWallet = async (walletData: {
  walletAddress: string;
  userId: string;
  walletType: string;
  isBackedUp: boolean;
  hasBiometrics: boolean;
}) => {
  try {
    // Convert camelCase to snake_case for the Rust backend
    const backendData = {
      wallet_address: walletData.walletAddress,
      user_id: walletData.userId,
      wallet_type: walletData.walletType,
      is_backed_up: walletData.isBackedUp,
      has_biometrics: walletData.hasBiometrics
    };
    
    const response = await api.post('/api/wallets', backendData);
    return response.data;
  } catch (error: any) {
    // console.error('Error registering wallet:', error.response?.data || error.message);
    throw error;
  }
};

// Transaction API functions
export const createTransaction = async (transactionData: {
  fromWallet: string;
  toWallet: string;
  amount: number;
  currency: string;
  signature: string;
}) => {
  try {
    // Convert camelCase to snake_case for the Rust backend
    const backendData = {
      from_wallet: transactionData.fromWallet,
      to_wallet: transactionData.toWallet,
      amount: transactionData.amount,
      currency: transactionData.currency,
      signature: transactionData.signature
    };
    
    // console.log('Sending transaction data:', backendData);
    
    // Try without the /api prefix
    const response = await api.post('/transactions', backendData);
    return response.data;
  } catch (error: any) {
    // console.error('Error creating transaction:', error.response?.data || error.message);
    throw error;
  }
};

// Error handling interceptor
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response) {
      // console.log('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // console.log('Network Error:', error.request);
    } else {
      // console.log('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
