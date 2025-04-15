// Configuration values for the app
import Constants from 'expo-constants';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';

// API URLs
export const LOCAL_BACKEND_SERVER_URL = 'http://127.0.0.1:8080';
export const PRODUCTION_API_URL = 'https://api.indexwallets.com';

// Use local server in development, production API in production
export const API_URL = isDevelopment ? LOCAL_BACKEND_SERVER_URL : PRODUCTION_API_URL;

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
