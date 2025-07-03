import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Storage helper functions to reduce duplication and handle platform differences
 */

/**
 * Store a value in both AsyncStorage and SecureStore
 * SecureStore is preferred for sensitive data but may not be available on web
 */
export const storeDual = async (key: string, value: string): Promise<void> => {
  // Always store in AsyncStorage as fallback
  await AsyncStorage.setItem(key, value);
  
  // Try to store in SecureStore if available
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    // SecureStore not available (likely on web)
    // AsyncStorage will handle it
  }
};

/**
 * Retrieve a value from SecureStore first, falling back to AsyncStorage
 */
export const retrieveDual = async (key: string): Promise<string | null> => {
  // Try SecureStore first (more secure)
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value) return value;
  } catch (e) {
    // SecureStore not available
  }
  
  // Fall back to AsyncStorage
  return await AsyncStorage.getItem(key);
};

/**
 * Remove a value from both storage systems
 */
export const removeDual = async (key: string): Promise<void> => {
  // Remove from both storage systems
  await AsyncStorage.removeItem(key);
  
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    // SecureStore not available
  }
};

/**
 * Store multiple key-value pairs efficiently
 */
export const storeMultiple = async (items: Record<string, string>): Promise<void> => {
  // Store in AsyncStorage
  const asyncStorageItems = Object.entries(items).map(([key, value]) => [key, value]);
  await AsyncStorage.multiSet(asyncStorageItems);
  
  // Try to store in SecureStore
  try {
    for (const [key, value] of Object.entries(items)) {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (e) {
    // SecureStore not available
  }
};

/**
 * Check if SecureStore is available (useful for debugging)
 */
export const isSecureStoreAvailable = async (): Promise<boolean> => {
  try {
    // Try a test operation
    await SecureStore.setItemAsync('test-key', 'test');
    await SecureStore.deleteItemAsync('test-key');
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Storage keys used throughout the app
 */
export const STORAGE_KEYS = {
  AUTH_STATUS: 'auth-status',
  SEED_PHRASE: 'encrypted-seed-phrase',
  PRIVATE_KEY: 'encrypted-private-key',
  PUBLIC_KEY: 'public-key',
  HAS_PASSKEY: 'has-passkey',
  ICLOUD_BACKUP_ENABLED: 'icloud-backup-enabled',
  BACKUP_STATUS: 'backup-status',
  USER_TYPE: 'user-type',
  USER_NAME: 'user-name',
  USER_DATA: 'user-data',
  USER_ID: 'USER_ID',
  IS_VERIFIED: 'is-verified',
  VALUATIONS: 'valuations',
  VENDOR_DESCRIPTION: 'vendor-description',
  VENDOR_GOOGLE_MAPS_LINK: 'vendor-google-maps-link',
  VENDOR_WEBSITE_LINK: 'vendor-website-link',
  // Deprecated - will be removed
  WALLET_ADDRESS: 'wallet-address',
} as const;

/**
 * Type-safe storage operations
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];