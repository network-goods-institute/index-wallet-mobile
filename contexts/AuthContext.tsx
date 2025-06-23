import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import api from '../services/api';
import { Platform, Alert } from 'react-native';
import { 
  generateSeedPhrase as generateSeedPhraseUtil, 
  validateSeedPhrase as validateSeedPhraseUtil, 
  createKeyPairFromSeedPhrase,
} from '@/utils/cryptoUtils';
import { registerUser, registerWallet } from '@/services/registerUser';
import { validateAndFetchWallet, createWallet } from '@/services/walletService';
import { UserAPI } from '@/services/api';


// Define types
export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'onboarding';
export type OnboardingStep = 'welcome' | 'user-type' | 'user-name' | 'vendor-slides' | 'customer-slides' | 'create-seed' | 'verify-seed' | 'security-settings' | 'import-seed' | 'create-passkey' | 'complete' | 'sign-in';
export type BackupStatus = 'none' | 'pending' | 'completed' | 'failed';
export type PlatformOS = 'ios' | 'android' | 'web' | 'unknown';
export type BackupProvider = 'iCloud' | 'Google Drive' | 'None' | 'Local';
export type UserType = 'vendor' | 'payee' | null;

interface AuthContextType {
  status: AuthStatus;
  onboardingStep: OnboardingStep;
  seedPhrase: string | null;
  keyPair: { privateKey: string; publicKey: string } | null;
  hasPasskey: boolean;
  iCloudBackupEnabled: boolean;
  backupStatus: BackupStatus;
  biometricsAvailable: boolean;
  platformOS: PlatformOS;
  backupProvider: BackupProvider;
  userType: UserType;
  userName: string | null;
  walletAddress: string | null;
  existingWallet: any | null;
  valuations: any | null;
  setSeedPhraseForOnboarding: (seedPhrase: string) => Promise<void>;
  setUserType: (type: UserType) => void;
  setUserName: (name: string) => void;
  validateSeedAndCheckWallet: (seedPhrase: string) => Promise<any | null>;
  
  // Authentication methods
  login: (seedPhrase: string, usePasskey?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  authenticateWithPasskey: () => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
  
  // Seed phrase methods
  generateSeedPhrase: () => string;
  validateSeedPhrase: (phrase: string) => boolean;
  
  // Onboarding methods
  startOnboarding: () => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  completeOnboarding: (seedPhrase: string, usePasskey: boolean) => Promise<boolean>;
  
  // Backup methods
  enableiCloudBackup: (enabled: boolean) => Promise<boolean>;
  backupToiCloud: () => Promise<boolean>;
  restoreFromiCloud: () => Promise<boolean>;
  
  // Cryptographic methods
}

// Storage keys
const AUTH_STATUS_KEY = 'auth-status';
const SEED_PHRASE_KEY = 'encrypted-seed-phrase';
const PRIVATE_KEY_KEY = 'encrypted-private-key';
const PUBLIC_KEY_KEY = 'public-key';
const HAS_PASSKEY_KEY = 'has-passkey';
const ICLOUD_BACKUP_ENABLED_KEY = 'icloud-backup-enabled';
const BACKUP_STATUS_KEY = 'backup-status';
const USER_TYPE_KEY = 'user-type';
const USER_NAME_KEY = 'user-name';
const WALLET_ADDRESS_KEY = 'wallet-address';
const USER_DATA_KEY = 'user-data';  // For storing complete user object
const VALUATIONS_KEY = 'valuations';


// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [keyPair, setKeyPair] = useState<{ privateKey: string; publicKey: string } | null>(null);
  const [hasPasskey, setHasPasskey] = useState<boolean>(false);
  const [iCloudBackupEnabled, setICloudBackupEnabled] = useState<boolean>(false);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>('none');
  const [biometricsAvailable, setBiometricsAvailable] = useState<boolean>(false);
  const [platformOS, setPlatformOS] = useState<PlatformOS>('unknown');
  const [backupProvider, setBackupProvider] = useState<BackupProvider>('None');
  const [userType, setUserType] = useState<UserType>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [existingWallet, setExistingWallet] = useState<any | null>(null);
  const [valuations, setValuations] = useState<any | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Add a custom setter for wallet address
  const updateWalletAddress = useCallback((address: string | null) => {
    // console.log('AUTH - Setting wallet address:', address);
    // console.log('AUTH - Previous wallet address:', walletAddress);
    // console.log('AUTH - Call stack:', new Error().stack);
    setWalletAddress(address);
  }, [walletAddress]);

  // Initialize auth state
  useEffect(() => {
    const detectPlatform = async () => {
      if (Device.isDevice) {
        const platform = await Device.getDeviceTypeAsync();
        const os = Device.osName as string;
        
        if (os === 'iOS') {
          setPlatformOS('ios');
          setBackupProvider('iCloud');
        } else if (os === 'Android') {
          setPlatformOS('android');
          setBackupProvider('Google Drive');
        } else {
          setPlatformOS('web');
          setBackupProvider('Local');
        }
      } else {
        // Running in simulator or web
        setPlatformOS('unknown');
        setBackupProvider('Local');
      }
    };
    
    const initializeAuth = async () => {
      try {
        // Detect platform first
        await detectPlatform();
        
        // Check if user has completed onboarding
        const storedStatus = await AsyncStorage.getItem(AUTH_STATUS_KEY);
        const storedHasPasskey = await AsyncStorage.getItem(HAS_PASSKEY_KEY);
        const storedICloudBackup = await AsyncStorage.getItem(ICLOUD_BACKUP_ENABLED_KEY);
        const storedBackupStatus = await AsyncStorage.getItem(BACKUP_STATUS_KEY) as BackupStatus || 'none';
        const storedUserType = await AsyncStorage.getItem(USER_TYPE_KEY) as UserType;
        const storedUserName = await AsyncStorage.getItem(USER_NAME_KEY);
        
        // Check if biometrics are available on the device
        const biometricsCheck = await LocalAuthentication.hasHardwareAsync();
        setBiometricsAvailable(biometricsCheck);
        
        if (storedStatus === 'authenticated') {
          // Load wallet info
          const walletAddress = await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
          const publicKey = await AsyncStorage.getItem(PUBLIC_KEY_KEY);
          
          // Load seed phrase and private key from secure storage or AsyncStorage
          let seedPhraseValue = null;
          let privateKey = null;
          
          try {
            // Try to get seed phrase from SecureStore first
            const encryptedSeedPhrase = await SecureStore.getItemAsync(SEED_PHRASE_KEY);
            // console.log('SecureStore seed phrase check:', encryptedSeedPhrase ? 'FOUND' : 'NOT FOUND');
            if (encryptedSeedPhrase) {
              // console.log('Encrypted seed phrase from SecureStore found');
              seedPhraseValue = await decryptData(encryptedSeedPhrase);
              // console.log('Decrypted seed phrase words count:', seedPhraseValue.split(' ').length);
            } else {
              // If not in SecureStore, try AsyncStorage
              const asyncStorageSeedPhrase = await AsyncStorage.getItem(SEED_PHRASE_KEY);
              // console.log('AsyncStorage seed phrase check:', asyncStorageSeedPhrase ? 'FOUND' : 'NOT FOUND');
              if (asyncStorageSeedPhrase) {
                // console.log('Encrypted seed phrase from AsyncStorage found');
                seedPhraseValue = await decryptData(asyncStorageSeedPhrase);
                // console.log('Decrypted seed phrase words count:', seedPhraseValue.split(' ').length);
              }
            }
            
            // Try to get private key from SecureStore first
            const encryptedPrivateKey = await SecureStore.getItemAsync(PRIVATE_KEY_KEY);
            // console.log('SecureStore private key check:', encryptedPrivateKey ? 'FOUND' : 'NOT FOUND');
            if (encryptedPrivateKey) {
              // console.log('Encrypted private key from SecureStore:', encryptedPrivateKey.substring(0, 20) + '...');
              privateKey = await decryptData(encryptedPrivateKey);
              // console.log('Decrypted private key length:', privateKey.length);
            } else {
              // If not in SecureStore, try AsyncStorage
              const asyncStoragePrivateKey = await AsyncStorage.getItem(PRIVATE_KEY_KEY);
              // console.log('AsyncStorage private key check:', asyncStoragePrivateKey ? 'FOUND' : 'NOT FOUND');
              if (asyncStoragePrivateKey) {
                // console.log('Encrypted private key from AsyncStorage:', asyncStoragePrivateKey.substring(0, 20) + '...');
                privateKey = await decryptData(asyncStoragePrivateKey);
                // console.log('Decrypted private key length:', privateKey.length);
              }
            }
            
            // If still no private key, use test key for development
            if (!privateKey) {
              // console.log('No private key found in storage, using test key for development');
              const testKey = '5JeqVC5myFajNwvqba1QNZLdWMNTnMkz5oSN5W1yJWhUr1TDQoP';
              privateKey = testKey;
              
              // Store the test key for future use
              const encryptedTestKey = await encryptData(testKey);
              try {
                await SecureStore.setItemAsync(PRIVATE_KEY_KEY, encryptedTestKey);
                // console.log('Stored test key in SecureStore');
              } catch (e) {
                await AsyncStorage.setItem(PRIVATE_KEY_KEY, encryptedTestKey);
                // console.log('Stored test key in AsyncStorage');
              }
            }
          } catch (error) {
            console.error('Error loading private key:', error);
            // Use test key as fallback
            privateKey = '5JeqVC5myFajNwvqba1QNZLdWMNTnMkz5oSN5W1yJWhUr1TDQoP';
            // console.log('Using fallback test key due to error');
          }
          
          // Set seed phrase in context if available
          if (seedPhraseValue) {
            // console.log('INIT: Setting seed phrase in context');
            // console.log('INIT: Seed phrase preview:', seedPhraseValue.split(' ').slice(0, 3).join(' ') + '...');
            setSeedPhrase(seedPhraseValue);
          } else {
            // console.log('INIT: No seed phrase found in storage');
          }
          
          // Set keyPair if we have both keys
          if (publicKey && privateKey) {
            // console.log('Setting keyPair in context with:');
            // console.log('- publicKey length:', publicKey.length);
            // console.log('- privateKey length:', privateKey.length);
            setKeyPair({ privateKey, publicKey });
            // console.log('Loaded key pair during initialization');
          } else {
            console.warn('Missing keys for keyPair:');
            console.warn('- publicKey exists:', !!publicKey);
            console.warn('- privateKey exists:', !!privateKey);
          }
          
          // Load user info
          const userDataStr = await AsyncStorage.getItem(USER_DATA_KEY);
          const userData = userDataStr ? JSON.parse(userDataStr) : null;
          const valuationsStr = await AsyncStorage.getItem(VALUATIONS_KEY);
          const valuations = valuationsStr ? JSON.parse(valuationsStr) : null;
          
          // Set state
          setStatus('authenticated');
          setHasPasskey(storedHasPasskey === 'true');
          setICloudBackupEnabled(storedICloudBackup === 'true');
          setBackupStatus(storedBackupStatus);
          if (storedUserType) setUserType(storedUserType);
          if (storedUserName) setUserName(storedUserName);
          if (userData) setExistingWallet(userData);
          if (valuations) setValuations(valuations);
          if (walletAddress) updateWalletAddress(walletAddress);
        } else if (storedStatus === 'onboarding') {
          setStatus('onboarding');
        } else {
          setStatus('unauthenticated');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setStatus('unauthenticated');
      }
    };

    initializeAuth();
  }, []);

  // Generate a new seed phrase using cryptoUtils
  const generateSeedPhrase = (): string => {
    // Use the real implementation from cryptoUtils
    return generateSeedPhraseUtil();
  };

  // Validate a seed phrase using cryptoUtils
  const validateSeedPhrase = (phrase: string): boolean => {
    // Use the real implementation from cryptoUtils
    return validateSeedPhraseUtil(phrase);
  };

  // Start the onboarding process
  const startOnboarding = () => {
    setStatus('onboarding');
    setOnboardingStep('welcome');
    AsyncStorage.setItem(AUTH_STATUS_KEY, 'onboarding');
  };
  
  // Set the seed phrase during onboarding (for use in security settings)
  const setSeedPhraseForOnboarding = async (phrase: string): Promise<void> => {
    setSeedPhrase(phrase);
    // We don't store it in AsyncStorage yet - that happens in completeOnboarding
  };

  // Encrypt data with a key
  const encryptData = async (data: string): Promise<string> => {
    try {
      // In a real implementation, use a proper encryption method
      // This is a simplified mock for demonstration
      const encryptionKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        'wallet-encryption-key'
      );
      
      // For a real app, use a proper encryption algorithm
      // This is just a mock for demonstration purposes
      return `encrypted:${data}`;
    } catch (error) {
      console.error('Error encrypting data:', error);
      return data; // Fallback to unencrypted in case of error
    }
  };

  // Decrypt data
  const decryptData = async (encryptedData: string): Promise<string> => {
    // In a real implementation, use proper decryption
    // This is a simplified mock for demonstration
    // console.log('Decrypting data:', encryptedData.substring(0, 20) + '...');
    
    if (encryptedData.startsWith('encrypted:')) {
      // console.log('Found encrypted: prefix, extracting data');
      return encryptedData.substring(10);
    }
    
    // Try other possible formats
    if (encryptedData.includes(':')) {
      // console.log('Found other prefix format, extracting after colon');
      return encryptedData.substring(encryptedData.indexOf(':') + 1);
    }
    
    // console.log('No encryption prefix found, returning as is');
    return encryptedData;
  };


  // Complete the onboarding process
  const completeOnboarding = async (seedPhrase: string, usePasskey: boolean): Promise<boolean> => {
    try {
      // Generate key pair from seed phrase
      const keyPair = await createKeyPairFromSeedPhrase(seedPhrase);
      // console.log("KEY PAIR: ", keyPair);
      
      // Log the private key for debugging
      // console.log('PRIVATE KEY (for debugging):', keyPair.privateKey);
      // console.log('PRIVATE KEY TYPE:', typeof keyPair.privateKey);
      // console.log('PRIVATE KEY LENGTH:', keyPair.privateKey.length);
      
      // Encrypt sensitive data
      const encryptedSeedPhrase = await encryptData(seedPhrase);
      const encryptedPrivateKey = await encryptData(keyPair.privateKey);
      
      // Store in secure storage if available, otherwise fall back to AsyncStorage
      try {
        await SecureStore.setItemAsync(SEED_PHRASE_KEY, encryptedSeedPhrase);
        await SecureStore.setItemAsync(PRIVATE_KEY_KEY, encryptedPrivateKey);
      } catch (secureStoreError) {
        console.warn('Secure storage failed, falling back to AsyncStorage:', secureStoreError);
        await AsyncStorage.setItem(SEED_PHRASE_KEY, encryptedSeedPhrase);
        await AsyncStorage.setItem(PRIVATE_KEY_KEY, encryptedPrivateKey);
      }
      
      // Public key doesn't need to be encrypted
      await AsyncStorage.setItem(PUBLIC_KEY_KEY, keyPair.publicKey);
      
      await AsyncStorage.setItem(HAS_PASSKEY_KEY, usePasskey ? 'true' : 'false');
      await AsyncStorage.setItem(AUTH_STATUS_KEY, 'authenticated');
      await AsyncStorage.setItem(BACKUP_STATUS_KEY, 'none');
      // Default iCloud backup to enabled
      await AsyncStorage.setItem(ICLOUD_BACKUP_ENABLED_KEY, 'true');
      
      setSeedPhrase(seedPhrase);
      setKeyPair(keyPair);
      setHasPasskey(usePasskey);
      setStatus('authenticated');
      setBackupStatus('none');
      setICloudBackupEnabled(true);
      setWalletAddress(keyPair.publicKey);
      
      // Use the full public key as the wallet address
      const walletAddress = keyPair.publicKey;
      
      // Use the user's name if available, otherwise use a default
      const displayName = userName || "Index Wallet User";
      
      // Get unique device ID (or generate one if not available)
      const deviceId = await getUniqueDeviceId();
      
      // Register user with backend
      try {
        // Register the user account
        const userData = await registerUser({
          walletAddress,
          username: displayName, 
          valuations: {}
        });
        
        // console.log('User registered successfully:', userData);
        
        // Store user ID for future API calls
        if (userData.userId) {
          // console.log('Storing user ID:', userData.userId);
          await AsyncStorage.setItem('USER_ID', userData.userId);
        }
      } catch (apiError: any) {
        // Log error and fail onboarding - we need a successful registration
        console.error('Error registering with backend:', apiError);
        
        // Clean up any stored data since registration failed
        try {
          await SecureStore.deleteItemAsync(SEED_PHRASE_KEY);
          await SecureStore.deleteItemAsync(PRIVATE_KEY_KEY);
          await AsyncStorage.removeItem(PUBLIC_KEY_KEY);
          await AsyncStorage.removeItem(HAS_PASSKEY_KEY);
          await AsyncStorage.removeItem(AUTH_STATUS_KEY);
        } catch (cleanupError) {
          console.error('Error cleaning up after failed registration:', cleanupError);
        }
        
        // Throw the error to be handled by the UI
        throw new Error(apiError.message || 'Registration failed. Please try again.');
      }
      
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  };
  
  // Get or generate a unique device ID
  const getUniqueDeviceId = async (): Promise<string> => {
    try {
      // Try to get stored device ID
      const storedDeviceId = await AsyncStorage.getItem('DEVICE_ID');
      if (storedDeviceId) {
        return storedDeviceId;
      }
      
      // Generate a new device ID
      let deviceId = '';
      
      // Try to use device-specific identifiers
      if (Device.isDevice) {
        deviceId = Device.deviceName + '-' + 
                  Device.modelName + '-' + 
                  await Crypto.digestStringAsync(
                    Crypto.CryptoDigestAlgorithm.SHA256,
                    Device.modelId + Device.totalMemory
                  );
      } else {
        // Fallback for simulators or web
        deviceId = 'web-' + await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Date.now().toString() + Math.random().toString()
        );
      }
      
      // Store the device ID for future use
      await AsyncStorage.setItem('DEVICE_ID', deviceId);
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      // Fallback
      const fallbackId = 'fallback-' + Date.now().toString();
      await AsyncStorage.setItem('DEVICE_ID', fallbackId);
      return fallbackId;
    }
  };

  // Login with seed phrase
  const login = async (inputSeedPhrase: string, usePasskey: boolean = false): Promise<boolean> => {
    try {
      // Validate the seed phrase using our real validation
      if (!validateSeedPhrase(inputSeedPhrase)) {
        console.error('LOGIN: Invalid seed phrase format');
        return false;
      }
      
      // Generate key pair from seed phrase
      // console.log('LOGIN: Deriving key pair from seed phrase...');
      const derivedKeyPair = await createKeyPairFromSeedPhrase(inputSeedPhrase);
      
      // Log the derived keys for debugging
      // console.log('LOGIN: Derived key pair successfully');
      // console.log('LOGIN: Private key type:', typeof derivedKeyPair.privateKey);
      // console.log('LOGIN: Private key length:', derivedKeyPair.privateKey.length);
      // console.log('LOGIN: Public key type:', typeof derivedKeyPair.publicKey);
      // console.log('LOGIN: Public key length:', derivedKeyPair.publicKey.length);
      // console.log('LOGIN: Private key (first 20 chars):', derivedKeyPair.privateKey.substring(0, 20) + '...');
      // console.log('LOGIN: Public key (first 20 chars):', derivedKeyPair.publicKey.substring(0, 20) + '...');
      
      // Check if a wallet with this seed phrase exists
      const wallet = await validateAndFetchWallet(inputSeedPhrase);
      
      // Clear any old wallet address
      await AsyncStorage.removeItem(WALLET_ADDRESS_KEY);
      
      // Set the wallet address if available from the backend
      if (wallet && wallet.wallet_address) {
        // console.log('LOGIN: Setting wallet address from backend:', wallet.wallet_address);
        await AsyncStorage.setItem(WALLET_ADDRESS_KEY, wallet.wallet_address);
        setWalletAddress(wallet.wallet_address);
      } else {
        // Fallback to using the public key as the wallet address
        // console.log('LOGIN: Setting wallet address from public key:', derivedKeyPair.publicKey);
        await AsyncStorage.setItem(WALLET_ADDRESS_KEY, derivedKeyPair.publicKey);
        setWalletAddress(derivedKeyPair.publicKey);
      }
      
      // Encrypt sensitive data
      // console.log('LOGIN: Encrypting seed phrase and private key...');
      const encryptedSeedPhrase = await encryptData(inputSeedPhrase);
      const encryptedPrivateKey = await encryptData(derivedKeyPair.privateKey);
      // console.log('LOGIN: Encryption completed');
      
      // Store in secure storage if available, otherwise fall back to AsyncStorage
      try {
        // console.log('LOGIN: Storing in SecureStore...');
        await SecureStore.setItemAsync(SEED_PHRASE_KEY, encryptedSeedPhrase);
        await SecureStore.setItemAsync(PRIVATE_KEY_KEY, encryptedPrivateKey);
        // console.log('LOGIN: Successfully stored in SecureStore');
      } catch (secureStoreError) {
        console.warn('LOGIN: Secure storage failed, falling back to AsyncStorage:', secureStoreError);
        await AsyncStorage.setItem(SEED_PHRASE_KEY, encryptedSeedPhrase);
        await AsyncStorage.setItem(PRIVATE_KEY_KEY, encryptedPrivateKey);
        // console.log('LOGIN: Stored in AsyncStorage as fallback');
      }
      
      // Public key doesn't need to be encrypted
      await AsyncStorage.setItem(PUBLIC_KEY_KEY, derivedKeyPair.publicKey);
      
      await AsyncStorage.setItem(HAS_PASSKEY_KEY, usePasskey ? 'true' : 'false');
      await AsyncStorage.setItem(AUTH_STATUS_KEY, 'authenticated');
      
      // Set context state with derived key pair
      // console.log('LOGIN: Setting context state...');
      setSeedPhrase(inputSeedPhrase);
      setKeyPair(derivedKeyPair);
      setHasPasskey(usePasskey);
      setStatus('authenticated');
      
      // console.log('LOGIN: Login completed successfully');
      // console.log('LOGIN: Key pair in context:', {
      //   privateKey: derivedKeyPair.privateKey.substring(0, 20) + '...',
      //   publicKey: derivedKeyPair.publicKey.substring(0, 20) + '...'
      // });
      
      return true;
    } catch (error) {
      console.error('LOGIN: Error during login:', error);
      return false;
    }
  };
  
  // Logout
  const logout = async (): Promise<void> => {
    try {
      // Clear ALL user-specific data from AsyncStorage
      const keysToRemove = [
        AUTH_STATUS_KEY,
        SEED_PHRASE_KEY,
        PRIVATE_KEY_KEY,
        PUBLIC_KEY_KEY,
        WALLET_ADDRESS_KEY,
        USER_DATA_KEY,
        VALUATIONS_KEY,
        USER_TYPE_KEY,
        USER_NAME_KEY,
        HAS_PASSKEY_KEY,
        ICLOUD_BACKUP_ENABLED_KEY,
        BACKUP_STATUS_KEY,
        'USER_ID',
        'user-id',
        'wallet-address',
        'username',
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      
      // Try to clear from SecureStore as well
      try {
        await SecureStore.deleteItemAsync(SEED_PHRASE_KEY);
        await SecureStore.deleteItemAsync(PRIVATE_KEY_KEY);
      } catch (secureStoreError) {
        console.warn('Error clearing SecureStore:', secureStoreError);
      }
      
      // Reset ALL state to initial values
      setSeedPhrase(null);
      setKeyPair(null);
      setWalletAddress(null);
      setValuations(null);
      setExistingWallet(null);
      setUserType(null);
      setUserName(null);
      setHasPasskey(false);
      setICloudBackupEnabled(false);
      setBackupStatus('none');
      setOnboardingStep('welcome');
      setStatus('unauthenticated');
      
      // console.log('Successfully logged out and cleared all user data');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  // Authenticate with passkey (mocked for now)
  const authenticateWithPasskey = async (): Promise<boolean> => {
    try {
      // In a real implementation, we would use biometrics here
      // For now, we'll just simulate success
      const success = true;
      
      if (success) {
        // Try to retrieve from SecureStore first, then fall back to AsyncStorage
        let storedSeedPhrase, storedPrivateKey;
        try {
          storedSeedPhrase = await SecureStore.getItemAsync(SEED_PHRASE_KEY);
          storedPrivateKey = await SecureStore.getItemAsync(PRIVATE_KEY_KEY);
        } catch (secureStoreError) {
          console.warn('Secure storage retrieval failed, trying AsyncStorage:', secureStoreError);
          storedSeedPhrase = await AsyncStorage.getItem(SEED_PHRASE_KEY);
          storedPrivateKey = await AsyncStorage.getItem(PRIVATE_KEY_KEY);
        }
        
        // Public key is always in AsyncStorage
        const storedPublicKey = await AsyncStorage.getItem(PUBLIC_KEY_KEY);
        
        if (storedSeedPhrase && storedPrivateKey && storedPublicKey) {
          const decryptedSeedPhrase = await decryptData(storedSeedPhrase);
          const decryptedPrivateKey = await decryptData(storedPrivateKey);
          
          setSeedPhrase(decryptedSeedPhrase);
          setKeyPair({
            privateKey: decryptedPrivateKey,
            publicKey: storedPublicKey
          });
          setStatus('authenticated');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error authenticating with passkey:', error);
      return false;
    }
  };
  
  // Authenticate with biometrics
  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      // Check if biometrics are available
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        // console.log('Biometric authentication not available on this device');
        return false;
      }
      
      // Check if the device has biometrics enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        // console.log('No biometrics enrolled on this device');
        return false;
      }
      
      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your wallet',
        fallbackLabel: 'Use passcode',
      });
      
      if (result.success) {
        // Try to retrieve from SecureStore first, then fall back to AsyncStorage
        let storedSeedPhrase, storedPrivateKey;
        try {
          storedSeedPhrase = await SecureStore.getItemAsync(SEED_PHRASE_KEY);
          storedPrivateKey = await SecureStore.getItemAsync(PRIVATE_KEY_KEY);
        } catch (secureStoreError) {
          console.warn('Secure storage retrieval failed, trying AsyncStorage:', secureStoreError);
          storedSeedPhrase = await AsyncStorage.getItem(SEED_PHRASE_KEY);
          storedPrivateKey = await AsyncStorage.getItem(PRIVATE_KEY_KEY);
        }
        
        // Public key is always in AsyncStorage
        const storedPublicKey = await AsyncStorage.getItem(PUBLIC_KEY_KEY);
        
        if (storedSeedPhrase && storedPrivateKey && storedPublicKey) {
          const decryptedSeedPhrase = await decryptData(storedSeedPhrase);
          const decryptedPrivateKey = await decryptData(storedPrivateKey);
          
          setSeedPhrase(decryptedSeedPhrase);
          setKeyPair({
            privateKey: decryptedPrivateKey,
            publicKey: storedPublicKey
          });
          setStatus('authenticated');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error authenticating with biometrics:', error);
      return false;
    }
  };

  // Enable or disable cloud backup (platform-specific)
  const enableiCloudBackup = async (enabled: boolean): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(ICLOUD_BACKUP_ENABLED_KEY, enabled ? 'true' : 'false');
      setICloudBackupEnabled(enabled);
      
      // If enabling backup, trigger a backup after a short delay to ensure state is updated
      if (enabled) {
        // Skip backup if we're still in onboarding to avoid errors
        if (status !== 'authenticated') {
          // console.log('Skipping backup during onboarding - will backup after authentication completes');
          return true;
        }
        
        // Add a small delay to ensure state is properly updated
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Only attempt backup if we have a seed phrase
        if (seedPhrase) {
          return await backupToiCloud();
        } else {
          // console.log('Backup enabled but no seed phrase available yet - backup will occur when available');
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error setting ${backupProvider} backup:`, error);
      return false;
    }
  };
  
  // Backup seed phrase to cloud (platform-specific)
  const backupToiCloud = async (): Promise<boolean> => {
    try {
      // Set backup status to pending
      setBackupStatus('pending');
      await AsyncStorage.setItem(BACKUP_STATUS_KEY, 'pending');
      
      
      // Ensure we have the seed phrase and key pair
      if (!seedPhrase || !keyPair) {
        console.error('No seed phrase or key pair available for backup');
        setBackupStatus('failed');
        await AsyncStorage.setItem(BACKUP_STATUS_KEY, 'failed');
        return false;
      }
      
      // Encrypt sensitive data for backup
      const encryptedSeedPhrase = await encryptData(seedPhrase);
      const encryptedPrivateKey = await encryptData(keyPair.privateKey);
      
      // Platform-specific backup implementation
      if (platformOS === 'ios') {
        // In a real implementation, this would use iCloud KeyValue storage
        // console.log('Using iCloud backup for iOS');
        // console.log('Backing up encrypted data:', { encryptedSeedPhrase, encryptedPrivateKey, publicKey: keyPair.publicKey });
      } else if (platformOS === 'android') {
        // In a real implementation, this would use Google Drive API
        // console.log('Using Google Drive backup for Android');
        // console.log('Backing up encrypted data:', { encryptedSeedPhrase, encryptedPrivateKey, publicKey: keyPair.publicKey });
      } else {
        // For web or unknown platforms, use local storage as fallback
        // console.log('Using local storage backup for web/unknown platform');
        // console.log('Backing up encrypted data:', { encryptedSeedPhrase, encryptedPrivateKey, publicKey: keyPair.publicKey });
      }
      
      // For this mock, we'll simulate a successful backup after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update backup status
      setBackupStatus('completed');
      await AsyncStorage.setItem(BACKUP_STATUS_KEY, 'completed');
      return true;
    } catch (error) {
      console.error(`Error backing up to ${backupProvider}:`, error);
      setBackupStatus('failed');
      await AsyncStorage.setItem(BACKUP_STATUS_KEY, 'failed');
      return false;
    }
  };
  
  // Restore seed phrase from cloud (platform-specific)
  const restoreFromiCloud = async (): Promise<boolean> => {
    try {
      // console.log(`Restoring from ${backupProvider}...`);
      
      // Platform-specific restore implementation
      if (platformOS === 'ios') {
        // In a real implementation, this would retrieve from iCloud KeyValue storage
        // console.log('Using iCloud restore for iOS');
      } else if (platformOS === 'android') {
        // In a real implementation, this would use Google Drive API
        // console.log('Using Google Drive restore for Android');
      } else {
        // For web or unknown platforms, use local storage as fallback
        // console.log('Using local storage restore for web/unknown platform');
      }
      
      // For this mock, we'll simulate a successful restore with a generated seed phrase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a new seed phrase (in a real implementation, this would be retrieved from cloud storage)
      const restoredSeedPhrase = generateSeedPhrase();
      
      // Generate key pair from seed phrase
      const keyPair = await createKeyPairFromSeedPhrase(restoredSeedPhrase);
      
      // Encrypt sensitive data
      const encryptedSeedPhrase = await encryptData(restoredSeedPhrase);
      const encryptedPrivateKey = await encryptData(keyPair.privateKey);
      
      // Store in secure storage if available, otherwise fall back to AsyncStorage
      try {
        await SecureStore.setItemAsync(SEED_PHRASE_KEY, encryptedSeedPhrase);
        await SecureStore.setItemAsync(PRIVATE_KEY_KEY, encryptedPrivateKey);
      } catch (secureStoreError) {
        console.warn('Secure storage failed, falling back to AsyncStorage:', secureStoreError);
        await AsyncStorage.setItem(SEED_PHRASE_KEY, encryptedSeedPhrase);
        await AsyncStorage.setItem(PRIVATE_KEY_KEY, encryptedPrivateKey);
      }
      
      // Public key doesn't need to be encrypted
      await AsyncStorage.setItem(PUBLIC_KEY_KEY, keyPair.publicKey);
      
      setSeedPhrase(restoredSeedPhrase);
      setKeyPair(keyPair);
      setStatus('authenticated');
      return true;
    } catch (error) {
      console.error(`Error restoring from ${backupProvider}:`, error);
      return false;
    }
  };

  // Validate seed phrase and check if wallet exists
  const validateSeedAndCheckWallet = async (phrase: string): Promise<any | null> => {
    // console.log("VALIDATING AND CHECKING WALLET: ")
    try {
      // First validate the seed phrase format
      if (!validateSeedPhrase(phrase)) {
        throw new Error('Invalid seed phrase format');
      }
      
      // Check if a wallet with this seed phrase exists
      const wallet = await validateAndFetchWallet(phrase);
      
      if (wallet) {
        // Store the user ID and other relevant data
        await AsyncStorage.setItem('user-id', wallet.user_id || '');
        await AsyncStorage.setItem('wallet-address', wallet.wallet_address);
        if (wallet.username) {
          await AsyncStorage.setItem('username', wallet.username);
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
        // Only set authenticated status if we found a valid wallet
        setStatus('authenticated');
      }
      
      return wallet;
    } catch (error) {
      console.error('Error validating seed phrase:', error);
      throw error;
    }
  };


  

  const value = {
    status,
    onboardingStep,
    seedPhrase,
    keyPair,
    hasPasskey,
    iCloudBackupEnabled,
    backupStatus,
    biometricsAvailable,
    platformOS,
    walletAddress,
    backupProvider,
    userType,
    valuations,
    setUserType: (type: UserType) => {
      setUserType(type);
      AsyncStorage.setItem(USER_TYPE_KEY, type || '');
    },
    userName,
    setUserName: (name: string) => {
      setUserName(name);
      AsyncStorage.setItem(USER_NAME_KEY, name);
    },
    login,
    logout,
    authenticateWithPasskey,
    authenticateWithBiometrics,
    generateSeedPhrase,
    validateSeedPhrase,
    startOnboarding,
    setOnboardingStep,
    setSeedPhraseForOnboarding,
    completeOnboarding,
    setWalletAddress,
    enableiCloudBackup,
    backupToiCloud,
    restoreFromiCloud,
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
