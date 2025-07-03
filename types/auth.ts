// Auth related types for AuthContext

export interface VendorInfo {
  description: string | null;
  googleMapsLink: string | null;
  websiteLink: string | null;
}

export interface WalletData {
  id: string;
  wallet_address: string;
  user_id: string;
  wallet_type: string;
  is_backed_up: boolean;
  has_biometrics: boolean;
  created_at: string;
  updated_at: string;
  username?: string;
  name?: string;
  email?: string;
  user_type?: 'vendor' | 'customer';
}

export interface Valuation {
  id: string;
  name: string;
  percentage: number;
  created_at: string;
  updated_at: string;
}

export interface AuthData {
  status: 'authenticated' | 'onboarding' | 'unauthenticated';
  hasPasskey: boolean;
  userType: 'vendor' | 'customer' | null;
  userName: string | null;
  isVerified: boolean;
  vendorData?: {
    description?: string;
    googleMapsLink?: string;
    websiteLink?: string;
  };
}

export interface WalletStorageData {
  seedPhrase: string | null;
  keyPair: {
    publicKey: string;
    privateKey: string;
  } | null;
  walletAddress: string | null;
}

export interface UserStorageData {
  userData: WalletData | null;
  valuations: Valuation[] | null;
}

export interface RegistrationData {
  walletAddress: string;
  username: string;
  userType: 'vendor' | 'customer';
  isVerified: boolean;
  vendorDescription?: string;
  vendorGoogleMapsLink?: string;
  vendorWebsiteLink?: string;
}

export interface ApiError {
  response?: {
    status: number;
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}