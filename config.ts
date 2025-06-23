// Configuration values for the app
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';

// Dynamic API URL detection for development
const getLocalApiUrl = () => {
  // Use platform-specific localhost URLs for development
  return Platform.select({
    ios: 'https://1470-207-38-194-26.ngrok-free.app',
    android: 'http://10.0.2.2:8080', // Android emulator localhost
    default: 'http://localhost:8080'
  }) || 'http://localhost:8080';
};

// API URLs
export const LOCAL_BACKEND_SERVER_URL = getLocalApiUrl();
export const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.indexwallets.com';

// Use local server in development, production API in production
export const API_URL = isDevelopment ? LOCAL_BACKEND_SERVER_URL : PRODUCTION_API_URL;

// Log the API URL for debugging
// console.log('🌐 API Configuration:');
// console.log('  - Environment:', isDevelopment ? 'Development' : 'Production');
// console.log('  - Platform:', Platform.OS);
// console.log('  - App Ownership:', Constants.appOwnership);

console.log('  - API URL:', API_URL);

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
