import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

type StorageType = 'standard' | 'secure';

class StorageService {
  private isWeb: boolean = false;

  constructor() {
    // Detect if we're running on web
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      this.isWeb = true;
    }
  }

  /**
   * Set an item in storage
   * @param key - The storage key
   * @param value - The value to store
   * @param type - Whether to use secure storage (when available) or standard storage
   */
  async setItem(key: string, value: string, type: StorageType = 'standard'): Promise<void> {
    try {
      if (type === 'secure' && !this.isWeb) {
        // Try SecureStore for sensitive data on mobile
        try {
          await SecureStore.setItemAsync(key, value);
          return;
        } catch (secureStoreError) {
          // console.warn(`SecureStore failed for key ${key}, falling back to AsyncStorage:`, secureStoreError);
        }
      }
      
      // Use AsyncStorage as default or fallback
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      // console.error(`Error storing item with key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get an item from storage
   * @param key - The storage key
   * @param type - Whether to check secure storage first
   */
  async getItem(key: string, type: StorageType = 'standard'): Promise<string | null> {
    try {
      if (type === 'secure' && !this.isWeb) {
        // Try SecureStore first for sensitive data on mobile
        try {
          const value = await SecureStore.getItemAsync(key);
          if (value !== null) {
            return value;
          }
        } catch (secureStoreError) {
          // SecureStore not available or failed
        }
      }
      
      // Use AsyncStorage as default or fallback
      return await AsyncStorage.getItem(key);
    } catch (error) {
      // console.error(`Error retrieving item with key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove an item from storage
   * @param key - The storage key
   * @param type - Whether to remove from secure storage as well
   */
  async removeItem(key: string, type: StorageType = 'standard'): Promise<void> {
    try {
      // Always try to remove from AsyncStorage
      await AsyncStorage.removeItem(key);
      
      // Also try to remove from SecureStore if it might be there
      if (type === 'secure' && !this.isWeb) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (secureStoreError) {
          // Ignore errors - item might not exist in SecureStore
        }
      }
    } catch (error) {
      // console.error(`Error removing item with key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove multiple items from storage
   * @param keys - Array of storage keys
   */
  async removeMultiple(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
      
      // Also try to remove from SecureStore if not on web
      if (!this.isWeb) {
        for (const key of keys) {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch {
            // Ignore individual errors
          }
        }
      }
    } catch (error) {
      // console.error('Error removing multiple items:', error);
      throw error;
    }
  }

  /**
   * Get all keys from AsyncStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      // console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      // console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Store JSON data
   */
  async setJSON(key: string, value: any, type: StorageType = 'standard'): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      await this.setItem(key, jsonString, type);
    } catch (error) {
      // console.error(`Error storing JSON with key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve JSON data
   */
  async getJSON<T = any>(key: string, type: StorageType = 'standard'): Promise<T | null> {
    try {
      const jsonString = await this.getItem(key, type);
      if (!jsonString) return null;
      return JSON.parse(jsonString) as T;
    } catch (error) {
      // console.error(`Error retrieving JSON with key ${key}:`, error);
      return null;
    }
  }
}

// Export a singleton instance
export const storage = new StorageService();

// Also export the class for testing
export { StorageService };