// Configuration values for the app
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Environment detection
const isDevelopment = __DEV__;

// Dynamic API URL detection for development
const getLocalApiUrl = () => {
  // Check for environment variable first
  if (process.env.EXPO_PUBLIC_LOCAL_API_URL) {
    return process.env.EXPO_PUBLIC_LOCAL_API_URL;
  }
  
  // Fallback to platform-specific localhost URLs for development
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_IOS_LOCAL_API_URL || 'http://localhost:8080',
    android: process.env.EXPO_PUBLIC_ANDROID_LOCAL_API_URL || 'http://10.0.2.2:8080', // Android emulator localhost
    default: 'http://localhost:8080'
  }) || 'http://localhost:8080';
};

// API URLs
export const LOCAL_BACKEND_SERVER_URL = getLocalApiUrl();
export const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL || Constants.expoConfig?.extra?.apiUrl || 'https://api.indexwallets.com';

// Use environment variable if available, otherwise use local in dev or production URL
export const API_URL = process.env.EXPO_PUBLIC_API_URL || (isDevelopment ? LOCAL_BACKEND_SERVER_URL : PRODUCTION_API_URL);



// Only log in development
if (isDevelopment) {
  console.log('API Configuration:');
  console.log('  - Environment:', isDevelopment ? 'development' : 'production');
  console.log('  - API URL:', API_URL);
}

// App configuration from app.json
export const APP_CONFIG = Constants.expoConfig || {};

// Feature flags
export const FEATURES = {
  enableBiometrics: true,
  enableCloudBackup: true,
  enablePasskeys: false, // Not yet implemented
};

// Default settings
export const DEFAULTS = {
  currency: 'USD',
  theme: 'system', // 'light', 'dark', or 'system'
};

export default {
  API_URL,
  LOCAL_BACKEND_SERVER_URL,
  PRODUCTION_API_URL,
  APP_CONFIG,
  FEATURES,
  DEFAULTS,
  isDevelopment,
};
