// Authentication and security keys
export const AUTH_KEYS = {
  AUTH_STATUS: 'auth-status',
  SEED_PHRASE: 'encrypted-seed-phrase',
  PRIVATE_KEY: 'encrypted-private-key',
  WALLET_ADDRESS: 'wallet-address',
  HAS_PASSKEY: 'has-passkey',
} as const;

// User information keys
export const USER_KEYS = {
  USER_TYPE: 'user-type',
  USER_NAME: 'user-name',
  USER_ID: 'USER_ID',
  USER_DATA: 'user-data',
  IS_VERIFIED: 'is-verified',
} as const;

// Vendor-specific keys
export const VENDOR_KEYS = {
  DESCRIPTION: 'vendor-description',
  GOOGLE_MAPS_LINK: 'vendor-google-maps-link',
  WEBSITE_LINK: 'vendor-website-link',
} as const;


// Other data keys
export const DATA_KEYS = {
  VALUATIONS: 'valuations',
  USER_DATA: 'user-data',
} as const;

// Combine all keys for easy access
export const STORAGE_KEYS = {
  ...AUTH_KEYS,
  ...USER_KEYS,
  ...VENDOR_KEYS,
  ...DATA_KEYS,
} as const;

// Type for all storage keys
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];