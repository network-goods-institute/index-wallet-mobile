import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Device from 'expo-device';
import { storage } from '@/services/storageService';
import { encryptData, decryptData } from '@/services/encryptionService';
import { AUTH_KEYS, USER_KEYS, VENDOR_KEYS, DATA_KEYS } from '@/constants/storageKeys';
import { 
  generateSeedPhrase as generateSeedPhraseUtil, 
  validateSeedPhrase as validateSeedPhraseUtil, 
  createKeyPairFromSeedPhrase,
} from '@/utils/cryptoUtils';
import { registerUser } from '@/services/registerUser';
import { validateAndFetchWallet } from '@/services/walletService';


// Define types
export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'onboarding';
export type OnboardingStep = 'welcome' | 'user-type' | 'user-name' | 'vendor-slides' | 'vendor-details' | 'customer-slides' | 'create-seed' | 'verify-seed' | 'security-settings' | 'import-seed' | 'create-passkey' | 'complete' | 'sign-in';
export type PlatformOS = 'ios' | 'android' | 'web' | 'unknown';
export type UserType = 'vendor' | 'customer' | null;

interface AuthContextType {
  status: AuthStatus;
  onboardingStep: OnboardingStep;
  seedPhrase: string | null;
  keyPair: { privateKey: string; publicKey: string } | null;
  hasPasskey: boolean;
  platformOS: PlatformOS;
  userType: UserType;
  userName: string | null;
  walletAddress: string | null;
  existingWallet: any | null;
  valuations: any | null;
  isVerified: boolean;
  vendorInfo: {
    description: string | null;
    googleMapsLink: string | null;
    websiteLink: string | null;
  };
  setSeedPhraseForOnboarding: (seedPhrase: string) => Promise<void>;
  setUserType: (type: UserType) => void;
  setUserName: (name: string) => void;
  setVendorInfo: (info: Partial<{ description: string; googleMapsLink: string; websiteLink: string }>) => void;
  validateSeedAndCheckWallet: (seedPhrase: string) => Promise<any | null>;
  
  // Authentication methods
  login: (seedPhrase: string, usePasskey?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Seed phrase methods
  generateSeedPhrase: () => string;
  validateSeedPhrase: (phrase: string) => boolean;
  
  // Onboarding methods
  startOnboarding: () => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  completeOnboarding: (seedPhrase: string, usePasskey: boolean) => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [keyPair, setKeyPair] = useState<{ privateKey: string; publicKey: string } | null>(null);
  const [hasPasskey, setHasPasskey] = useState<boolean>(false);
  const [platformOS, setPlatformOS] = useState<PlatformOS>('unknown');
  const [userType, setUserType] = useState<UserType>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [existingWallet, setExistingWallet] = useState<any | null>(null);
  const [valuations, setValuations] = useState<any | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [vendorInfo, setVendorInfo] = useState<{
    description: string | null;
    googleMapsLink: string | null;
    websiteLink: string | null;
  }>({ description: null, googleMapsLink: null, websiteLink: null });
  
  // Add a custom setter for wallet address
  const updateWalletAddress = useCallback((address: string | null) => {
    setWalletAddress(address);
  }, []);
  
  // Add recovery mechanism for missing data
  const recoverMissingData = async () => {
    try {
      // If we're authenticated but missing username or wallet address, try to recover
      if (status === 'authenticated' && (!userName || !walletAddress)) {
        
        // Try to get from storage first
        if (!userName) {
          const storedUserName = await storage.getItem(USER_KEYS.USER_NAME, 'secure');
          if (storedUserName) {
              setUserName(storedUserName);
          }
        }
        
        if (!walletAddress) {
          const storedWalletAddress = await storage.getItem(AUTH_KEYS.WALLET_ADDRESS, 'secure');
          if (storedWalletAddress) {
            updateWalletAddress(storedWalletAddress);
          } else if (keyPair?.publicKey) {
            // Use public key as fallback
            updateWalletAddress(keyPair.publicKey);
            await storage.setItem(AUTH_KEYS.WALLET_ADDRESS, keyPair.publicKey, 'secure');
          }
        }
        
        // If we have a seed phrase but still missing data, try to fetch from backend
        if (seedPhrase && (!userName || !walletAddress)) {
          try {
            const wallet = await validateAndFetchWallet(seedPhrase);
            if (wallet) {
              if (!userName && wallet.username) {
                  setUserName(wallet.username);
                await storage.setItem(USER_KEYS.USER_NAME, wallet.username, 'secure');
              }
              if (!walletAddress && wallet.wallet_address) {
                updateWalletAddress(wallet.wallet_address);
                await storage.setItem(AUTH_KEYS.WALLET_ADDRESS, wallet.wallet_address, 'secure');
              }
            }
          } catch (e) {
          }
        }
      }
    } catch (error) {
    }
  };
  
  // Run recovery mechanism when status or key data changes
  useEffect(() => {
    if (status === 'authenticated') {
      // Add a small delay to ensure all state is set
      const timer = setTimeout(() => {
        recoverMissingData();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, userName, walletAddress, seedPhrase, keyPair]);
  
  // Initialize auth state
  useEffect(() => {
    const detectPlatform = async () => {
      if (Device.isDevice) {
        const os = Device.osName as string;
        
        if (os === 'iOS') {
          setPlatformOS('ios');
        } else if (os === 'Android') {
          setPlatformOS('android');
        } else {
          setPlatformOS('web');
        }
      } else {
        // Running in simulator or web
        setPlatformOS('unknown');
      }
    };
    
    // Helper function to load basic auth data from storage
    const loadBasicAuthData = async () => {
      const storedStatus = await storage.getItem(AUTH_KEYS.AUTH_STATUS);
      const storedHasPasskey = await storage.getItem(AUTH_KEYS.HAS_PASSKEY);
      const storedUserType = await storage.getItem(USER_KEYS.USER_TYPE) as UserType;
      const storedUserName = await storage.getItem(USER_KEYS.USER_NAME, 'secure');
      const storedIsVerified = await storage.getItem(USER_KEYS.IS_VERIFIED);
      
      // Load vendor-specific data if user type is vendor
      let vendorData = null;
      if (storedUserType === 'vendor') {
        vendorData = {
          description: await storage.getItem(VENDOR_KEYS.DESCRIPTION),
          googleMapsLink: await storage.getItem(VENDOR_KEYS.GOOGLE_MAPS_LINK),
          websiteLink: await storage.getItem(VENDOR_KEYS.WEBSITE_LINK),
        };
      }
      
      return {
        status: storedStatus,
        hasPasskey: storedHasPasskey === 'true',
        userType: storedUserType,
        userName: storedUserName,
        isVerified: storedIsVerified === 'true',
        vendorData,
      };
    };
    
    // Helper function to load wallet and crypto data
    const loadWalletData = async () => {
      let walletAddress = null;
      let privateKey = null;
      let seedPhraseValue = null;
      
      try {
        walletAddress = await storage.getItem(AUTH_KEYS.WALLET_ADDRESS, 'secure');
      } catch (e) {
        // Failed to load wallet address
      }
      
      try {
        const encryptedSeedPhrase = await storage.getItem(AUTH_KEYS.SEED_PHRASE, 'secure');
        if (encryptedSeedPhrase) {
          seedPhraseValue = await decryptData(encryptedSeedPhrase);
        }
        
        const encryptedPrivateKey = await storage.getItem(AUTH_KEYS.PRIVATE_KEY, 'secure');
        if (encryptedPrivateKey) {
          privateKey = await decryptData(encryptedPrivateKey);
        }
        
        // If still no private key, try to regenerate from seed phrase
        if (!privateKey && seedPhraseValue) {
          const regeneratedKeyPair = await createKeyPairFromSeedPhrase(seedPhraseValue);
          privateKey = regeneratedKeyPair.privateKey;
          
          if (!walletAddress) {
            walletAddress = regeneratedKeyPair.publicKey;
            await storage.setItem(AUTH_KEYS.WALLET_ADDRESS, walletAddress, 'secure');
          }
          
          const encryptedKey = await encryptData(privateKey);
          await storage.setItem(AUTH_KEYS.PRIVATE_KEY, encryptedKey, 'secure');
        }
      } catch (error) {
        // Error loading wallet data
      }
      
      return {
        seedPhrase: seedPhraseValue,
        keyPair: walletAddress && privateKey ? { privateKey, publicKey: walletAddress } : null,
        walletAddress,
      };
    };
    
    // Helper function to load user data
    const loadUserData = async () => {
      let userData = null;
      let valuations = null;
      
      try {
        userData = await storage.getJSON(DATA_KEYS.USER_DATA);
      } catch (e) {
        // Failed to load user data
      }
      
      try {
        valuations = await storage.getJSON(DATA_KEYS.VALUATIONS);
      } catch (e) {
        // Failed to load valuations
      }
      
      return { userData, valuations };
    };
    
    // Helper function to apply all loaded state
    const applyLoadedState = (authData: any, walletData: any, userData: any) => {
      // Set basic auth state
      setHasPasskey(authData.hasPasskey);
      if (authData.userType) setUserType(authData.userType);
      if (authData.userName) setUserName(authData.userName);
      setIsVerified(authData.isVerified);
      
      // Set vendor data if present
      if (authData.vendorData) {
        setVendorInfo({
          description: authData.vendorData.description || null,
          googleMapsLink: authData.vendorData.googleMapsLink || null,
          websiteLink: authData.vendorData.websiteLink || null,
        });
      }
      
      // Set wallet data
      if (walletData.seedPhrase) setSeedPhrase(walletData.seedPhrase);
      if (walletData.keyPair) setKeyPair(walletData.keyPair);
      if (walletData.walletAddress) updateWalletAddress(walletData.walletAddress);
      
      // Set user data
      if (userData.userData) setExistingWallet(userData.userData);
      if (userData.valuations) setValuations(userData.valuations);
    };
    
    const initializeAuth = async () => {
      try {
        // Detect platform first
        await detectPlatform();
        
        // Load basic auth data
        const authData = await loadBasicAuthData();
        
        if (authData.status === 'authenticated') {
          // Load wallet and user data in parallel for better performance
          const [walletData, userData] = await Promise.all([
            loadWalletData(),
            loadUserData()
          ]);
          
          // Apply all loaded state
          applyLoadedState(authData, walletData, userData);
          
          // Set authenticated status LAST to ensure all data is ready
          setStatus('authenticated');
        } else if (authData.status === 'onboarding') {
          setStatus('onboarding');
        } else {
          setStatus('unauthenticated');
        }
      } catch (error) {
        setStatus('unauthenticated');
      }
    };

    initializeAuth();
  }, [updateWalletAddress]);

  // Generate a new seed phrase using cryptoUtils
  const generateSeedPhrase = (): string => {
    return generateSeedPhraseUtil();
  };

  // Validate a seed phrase using cryptoUtils
  const validateSeedPhrase = (phrase: string): boolean => {
    return validateSeedPhraseUtil(phrase);
  };

  // Start the onboarding process
  const startOnboarding = () => {
    setStatus('onboarding');
    setOnboardingStep('welcome');
    storage.setItem(AUTH_KEYS.AUTH_STATUS, 'onboarding');
  };
  
  // Set the seed phrase during onboarding (for use in security settings)
  const setSeedPhraseForOnboarding = async (phrase: string): Promise<void> => {
    setSeedPhrase(phrase);
    // We don't store it in AsyncStorage yet - that happens in completeOnboarding
  };



  // Complete the onboarding process
  const completeOnboarding = async (seedPhrase: string, usePasskey: boolean): Promise<boolean> => {
    try {
      // Generate key pair from seed phrase
      const keyPair = await createKeyPairFromSeedPhrase(seedPhrase);
      
      // Encrypt sensitive data
      const encryptedSeedPhrase = await encryptData(seedPhrase);
      const encryptedPrivateKey = await encryptData(keyPair.privateKey);
      
      // Store in secure storage
      await storage.setItem(AUTH_KEYS.SEED_PHRASE, encryptedSeedPhrase, 'secure');
      await storage.setItem(AUTH_KEYS.PRIVATE_KEY, encryptedPrivateKey, 'secure');
      
      // Public key is stored as wallet address, no need to store separately
      
      await storage.setItem(AUTH_KEYS.HAS_PASSKEY, usePasskey ? 'true' : 'false');
      await storage.setItem(AUTH_KEYS.AUTH_STATUS, 'authenticated');
      
      setSeedPhrase(seedPhrase);
      setKeyPair(keyPair);
      setHasPasskey(usePasskey);
      setStatus('authenticated');
      
      // Use the full public key as the wallet address
      const walletAddress = keyPair.publicKey;
      updateWalletAddress(walletAddress);
      
      // Save wallet address to both AsyncStorage and SecureStore for redundancy
      await storage.setItem(AUTH_KEYS.WALLET_ADDRESS, walletAddress);
      try {
      } catch (e) {
      }
      
      // Use the user's name if available, otherwise use a default
      const displayName = userName || "Index Wallet User";
      
      // Register user with backend
      try {
        // Register the user account
        const registrationData: any = {
          walletAddress,
          username: displayName,
          userType: userType || 'customer',
          isVerified: false
        };

        // Add vendor-specific fields if user type is vendor
        if (userType === 'vendor') {
          if (vendorInfo.description) {
            registrationData.vendorDescription = vendorInfo.description;
          }
          if (vendorInfo.googleMapsLink) {
            registrationData.vendorGoogleMapsLink = vendorInfo.googleMapsLink;
          }
          if (vendorInfo.websiteLink) {
            registrationData.vendorWebsiteLink = vendorInfo.websiteLink;
          }
        }

        const userData = await registerUser(registrationData);
        
        // Store user ID for future API calls
        if (userData.userId) {
          await storage.setItem(USER_KEYS.USER_ID, userData.userId);
        }
        
        // Store username to both AsyncStorage and SecureStore for redundancy
        if (userName) {
          await storage.setItem(USER_KEYS.USER_NAME, userName, 'secure');
        }
        
        // Store user type to AsyncStorage
        if (userType) {
          await storage.setItem(USER_KEYS.USER_TYPE, userType);
        }
        
        // Store isVerified status
        const verifiedStatus = registrationData.isVerified || false;
        setIsVerified(verifiedStatus);
        await storage.setItem(USER_KEYS.IS_VERIFIED, verifiedStatus.toString());
        
        // Store vendor-specific data if user is a vendor
        if (userType === 'vendor') {
          if (vendorInfo.description) {
            await storage.setItem(VENDOR_KEYS.DESCRIPTION, vendorInfo.description);
          }
          if (vendorInfo.googleMapsLink) {
            await storage.setItem(VENDOR_KEYS.GOOGLE_MAPS_LINK, vendorInfo.googleMapsLink);
          }
          if (vendorInfo.websiteLink) {
            await storage.setItem(VENDOR_KEYS.WEBSITE_LINK, vendorInfo.websiteLink);
          }
        }
      } catch (apiError: any) {
        
        // Clean up any stored data since registration failed
        try {
          await storage.removeItem(AUTH_KEYS.SEED_PHRASE, 'secure');
          await storage.removeItem(AUTH_KEYS.PRIVATE_KEY, 'secure');
            await storage.removeItem(AUTH_KEYS.HAS_PASSKEY);
          await storage.removeItem(AUTH_KEYS.AUTH_STATUS);
        } catch (cleanupError) {
        }
        
        // Throw the error to be handled by the UI
        throw new Error(apiError.message || 'Registration failed. Please try again.');
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };
  

  // Login with seed phrase
  const login = async (inputSeedPhrase: string, usePasskey: boolean = false): Promise<boolean> => {
    try {
      // Validate the seed phrase using our real validation
      if (!validateSeedPhrase(inputSeedPhrase)) {
        return false;
      }
      
      const derivedKeyPair = await createKeyPairFromSeedPhrase(inputSeedPhrase);
      
      // Check if a wallet with this seed phrase exists
      const wallet = await validateAndFetchWallet(inputSeedPhrase);
      
      // Clear any old wallet address
      await storage.removeItem(AUTH_KEYS.WALLET_ADDRESS);
      
      // Set the wallet address if available from the backend
      if (wallet && wallet.wallet_address) {
        await storage.setItem(AUTH_KEYS.WALLET_ADDRESS, wallet.wallet_address, 'secure');
        setWalletAddress(wallet.wallet_address);
        
        // Also restore username if available
        if (wallet.username) {
          await storage.setItem(USER_KEYS.USER_NAME, wallet.username, 'secure');
          setUserName(wallet.username);
        }
        
        // Always check local storage as well to ensure we don't lose data
        const localUserName = await storage.getItem(USER_KEYS.USER_NAME);
        if (!wallet.username && localUserName) {
          setUserName(localUserName);
        }
        
        // Restore user type if available
        if (wallet.user_type) {
          await storage.setItem(USER_KEYS.USER_TYPE, wallet.user_type);
          setUserType(wallet.user_type);
        }
      } else {
        // Fallback to using the public key as the wallet address
        await storage.setItem(AUTH_KEYS.WALLET_ADDRESS, derivedKeyPair.publicKey, 'secure');
        setWalletAddress(derivedKeyPair.publicKey);
      }
      
      // Encrypt sensitive data
      const encryptedSeedPhrase = await encryptData(inputSeedPhrase);
      const encryptedPrivateKey = await encryptData(derivedKeyPair.privateKey);
      
      // Store in secure storage
      await storage.setItem(AUTH_KEYS.SEED_PHRASE, encryptedSeedPhrase, 'secure');
      await storage.setItem(AUTH_KEYS.PRIVATE_KEY, encryptedPrivateKey, 'secure');
      
      // Public key is stored as wallet address, no need to store separately
      
      await storage.setItem(AUTH_KEYS.HAS_PASSKEY, usePasskey ? 'true' : 'false');
      await storage.setItem(AUTH_KEYS.AUTH_STATUS, 'authenticated');
      
      // Set context state with derived key pair
      setSeedPhrase(inputSeedPhrase);
      setKeyPair(derivedKeyPair);
      setHasPasskey(usePasskey);
      setStatus('authenticated');
      
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Logout
  const logout = async (): Promise<void> => {
    try {
      // Clear ALL user-specific data from AsyncStorage
      const keysToRemove = [
        AUTH_KEYS.AUTH_STATUS,
        AUTH_KEYS.SEED_PHRASE,
        AUTH_KEYS.PRIVATE_KEY,
        AUTH_KEYS.WALLET_ADDRESS,
        DATA_KEYS.USER_DATA,
        DATA_KEYS.VALUATIONS,
        USER_KEYS.USER_TYPE,
        USER_KEYS.USER_NAME,
        USER_KEYS.IS_VERIFIED,
        VENDOR_KEYS.DESCRIPTION,
        VENDOR_KEYS.GOOGLE_MAPS_LINK,
        VENDOR_KEYS.WEBSITE_LINK,
        AUTH_KEYS.HAS_PASSKEY,
        USER_KEYS.USER_ID,
      ];
      
      await storage.removeMultiple(keysToRemove);
      
      // Clear secure storage items
      await storage.removeItem(AUTH_KEYS.SEED_PHRASE, 'secure');
      await storage.removeItem(AUTH_KEYS.PRIVATE_KEY, 'secure');
      await storage.removeItem(USER_KEYS.USER_NAME, 'secure');
      await storage.removeItem(AUTH_KEYS.WALLET_ADDRESS, 'secure');
      
      // Reset ALL state to initial values
      setSeedPhrase(null);
      setKeyPair(null);
      setWalletAddress(null);
      setValuations(null);
      setExistingWallet(null);
      setUserType(null);
      setUserName(null);
      setIsVerified(false);
      setVendorInfo({ description: null, googleMapsLink: null, websiteLink: null });
      setHasPasskey(false);
      setOnboardingStep('welcome');
      setStatus('unauthenticated');
    } catch (error) {
    }
  };
  // Validate seed phrase and check if wallet exists
  const validateSeedAndCheckWallet = async (phrase: string): Promise<any | null> => {
    try {
      // First validate the seed phrase format
      if (!validateSeedPhrase(phrase)) {
        throw new Error('Invalid seed phrase format');
      }
      
      // Check if a wallet with this seed phrase exists
      const wallet = await validateAndFetchWallet(phrase);
      
      if (wallet) {
        // Store the user ID and other relevant data
        await storage.setItem(USER_KEYS.USER_ID, wallet.user_id || '');
        await storage.setItem(AUTH_KEYS.WALLET_ADDRESS, wallet.wallet_address);
        if (wallet.username) {
          await storage.setItem(USER_KEYS.USER_NAME, wallet.username);
        }

        if (wallet.wallet_address) {
          setWalletAddress(wallet.wallet_address);
        }
        // Set the user type if available
        if (wallet.user_type) {
          setUserType(wallet.user_type as UserType);
        }
        // Set username if available
        if (wallet.username) {
          setUserName(wallet.username);
        }
        // Don't set authenticated status here - let login() handle it after deriving keys
      }
      
      return wallet;
    } catch (error) {
      throw error;
    }
  };


  

  const value = {
    status,
    onboardingStep,
    seedPhrase,
    keyPair,
    hasPasskey,
    platformOS,
    walletAddress,
    userType,
    valuations,
    setUserType: (type: UserType) => {
      setUserType(type);
      storage.setItem(USER_KEYS.USER_TYPE, type || '');
    },
    userName,
    setUserName: (name: string) => {
      setUserName(name);
      storage.setItem(USER_KEYS.USER_NAME, name);
    },
    isVerified,
    vendorInfo,
    setVendorInfo: (info: Partial<{ description: string; googleMapsLink: string; websiteLink: string }>) => {
      setVendorInfo(prev => ({ ...prev, ...info }));
      // Save each field to storage if provided
      if (info.description !== undefined) {
        storage.setItem(VENDOR_KEYS.DESCRIPTION, info.description);
      }
      if (info.googleMapsLink !== undefined) {
        storage.setItem(VENDOR_KEYS.GOOGLE_MAPS_LINK, info.googleMapsLink);
      }
      if (info.websiteLink !== undefined) {
        storage.setItem(VENDOR_KEYS.WEBSITE_LINK, info.websiteLink);
      }
    },
    login,
    logout,
    generateSeedPhrase,
    validateSeedPhrase,
    startOnboarding,
    setOnboardingStep,
    setSeedPhraseForOnboarding,
    completeOnboarding,
    setWalletAddress: updateWalletAddress,
    existingWallet,
    validateSeedAndCheckWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
