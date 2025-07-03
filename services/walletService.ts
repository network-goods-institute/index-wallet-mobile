import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { createKeyPairFromSeedPhrase } from '@/utils/cryptoUtils';
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

/**
 * Interface for wallet data returned from the backend
 */
interface WalletData {
  id: string;
  wallet_address: string;
  user_id: string;
  wallet_type: string;
  is_backed_up: boolean;
  has_biometrics: boolean;
  created_at: string;
  updated_at: string;
  // User info
  username?: string;
  name?: string;
  email?: string;
  user_type?: 'vendor' | 'customer';
  valuations?: any;
  is_verified?: boolean;
}

/**
 * Validates a seed phrase and fetches or creates a wallet
 * 
 * This function will:
 * 1. Generate a wallet address from the seed phrase
 * 2. Check if a wallet with this address exists
 * 3. If it exists, return the wallet data
 * 4. If it doesn't exist, return null (wallet will be created later in the onboarding flow)
 * 
 * @param seedPhrase - The BIP39 mnemonic seed phrase
 * @returns The wallet data if found, null otherwise
 */
export const validateAndFetchWallet = async (seedPhrase: string): Promise<WalletData | null> => {
  try {
    // Generate wallet address from seed phrase
    const keyPair = await createKeyPairFromSeedPhrase(seedPhrase);
    const walletAddress = keyPair.publicKey;
    
    try {
      // Try to fetch the wallet by address
      const response = await api.get(`/api/users/${walletAddress}`);
      return response.data;
    } catch (error: any) {
      // If we get a 404, the wallet doesn't exist yet
      if (error.response && error.response.status === 404) {
        return null;
      }
      
      // For other errors, rethrow
      throw error;
    }
  } catch (error: any) {
    throw error;
  }
};

/**
 * Creates a new wallet in the backend
 * 
 * @param walletData - The wallet data to register
 * @returns The created wallet data
 */
export const createWallet = async (walletData: {
  walletAddress: string;
  userId: string;
  walletType: string;
  isBackedUp: boolean;
  hasBiometrics: boolean;
}): Promise<WalletData> => {
  try {
    // Convert camelCase to snake_case for the backend
    const backendData = {
      wallet_address: walletData.walletAddress,
      user_id: walletData.userId,
      wallet_type: walletData.walletType,
      is_backed_up: walletData.isBackedUp,
      has_biometrics: walletData.hasBiometrics
    };
    
    
    const response = await api.post('/users', backendData);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
