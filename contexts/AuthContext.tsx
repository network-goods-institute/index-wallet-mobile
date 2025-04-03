import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { 
  generateSeedPhrase as generateSeedPhraseUtil, 
  validateSeedPhrase as validateSeedPhraseUtil, 
  createKeyPairFromSeedPhrase,
  signMessageWithPrivateKey
} from '@/utils/cryptoUtils';

// Define types
export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'onboarding';
export type OnboardingStep = 'welcome' | 'create-seed' | 'verify-seed' | 'import-seed' | 'create-passkey' | 'complete';
export type BackupStatus = 'none' | 'pending' | 'completed' | 'failed';
export type PlatformOS = 'ios' | 'android' | 'web' | 'unknown';
export type BackupProvider = 'iCloud' | 'Google Drive' | 'None' | 'Local';

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
  setSeedPhraseForOnboarding: (seedPhrase: string) => Promise<void>;
  
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
  signMessage: (message: string) => Promise<string | null>;
}

// Storage keys
const AUTH_STATUS_KEY = 'auth-status';
const SEED_PHRASE_KEY = 'encrypted-seed-phrase';
const PRIVATE_KEY_KEY = 'encrypted-private-key';
const PUBLIC_KEY_KEY = 'public-key';
const HAS_PASSKEY_KEY = 'has-passkey';
const ICLOUD_BACKUP_ENABLED_KEY = 'icloud-backup-enabled';
const BACKUP_STATUS_KEY = 'backup-status';
const BIOMETRIC_ENABLED_KEY = 'biometric-enabled';

// Mock seed phrases
const MOCK_SEED_PHRASES = [
  'abandon ability able about above absent absorb abstract absurd abuse access accident',
  'above absent absorb abstract absurd abuse access accident account accuse achieve',
  'ability able about above absent absorb abstract absurd abuse access accident account',
];

// Mock private keys (these would be derived from seed phrases in a real implementation)
const MOCK_PRIVATE_KEYS = [
  '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g',
  '0x2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g',
  '0x3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g',
];

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
        
        // Check if biometrics are available on the device
        const biometricsCheck = await LocalAuthentication.hasHardwareAsync();
        setBiometricsAvailable(biometricsCheck);
        
        if (storedStatus === 'authenticated') {
          setStatus('authenticated');
          setHasPasskey(storedHasPasskey === 'true');
          setICloudBackupEnabled(storedICloudBackup === 'true');
          setBackupStatus(storedBackupStatus);
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

  // Generate a new seed phrase (mocked)
  const generateSeedPhrase = (): string => {
    // Return a random mock seed phrase
    return MOCK_SEED_PHRASES[Math.floor(Math.random() * MOCK_SEED_PHRASES.length)];
  };

  // Validate a seed phrase (mocked)
  const validateSeedPhrase = (phrase: string): boolean => {
    // Check if the phrase is in our mock list
    return MOCK_SEED_PHRASES.includes(phrase);
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
    if (encryptedData.startsWith('encrypted:')) {
      return encryptedData.substring(10);
    }
    return encryptedData;
  };

  // Complete the onboarding process
  const completeOnboarding = async (seedPhrase: string, usePasskey: boolean): Promise<boolean> => {
    try {
      // Generate key pair from seed phrase
      const keyPair = await createKeyPairFromSeedPhrase(seedPhrase);
      
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
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
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
      
      // Generate key pair from seed phrase
      const keyPair = await createKeyPairFromSeedPhrase(inputSeedPhrase);
      
      // Encrypt sensitive data
      const encryptedSeedPhrase = await encryptData(inputSeedPhrase);
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
      
      setSeedPhrase(inputSeedPhrase);
      setKeyPair(keyPair);
      setHasPasskey(usePasskey);
      setStatus('authenticated');
      return true;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      // In a real app, you might want to keep the seed phrase but require authentication
      // For this example, we'll clear everything
      await AsyncStorage.removeItem(AUTH_STATUS_KEY);
      setSeedPhrase(null);
      setStatus('unauthenticated');
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
        console.log('Biometric authentication not available on this device');
        return false;
      }
      
      // Check if the device has biometrics enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        console.log('No biometrics enrolled on this device');
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
      
      // If enabling backup, trigger an immediate backup
      if (enabled && seedPhrase) {
        return await backupToiCloud();
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
      
      console.log(`Backing up to ${backupProvider}...`);
      
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
        console.log('Using iCloud backup for iOS');
        console.log('Backing up encrypted data:', { encryptedSeedPhrase, encryptedPrivateKey, publicKey: keyPair.publicKey });
      } else if (platformOS === 'android') {
        // In a real implementation, this would use Google Drive API
        console.log('Using Google Drive backup for Android');
        console.log('Backing up encrypted data:', { encryptedSeedPhrase, encryptedPrivateKey, publicKey: keyPair.publicKey });
      } else {
        // For web or unknown platforms, use local storage as fallback
        console.log('Using local storage backup for web/unknown platform');
        console.log('Backing up encrypted data:', { encryptedSeedPhrase, encryptedPrivateKey, publicKey: keyPair.publicKey });
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
      console.log(`Restoring from ${backupProvider}...`);
      
      // Platform-specific restore implementation
      if (platformOS === 'ios') {
        // In a real implementation, this would retrieve from iCloud KeyValue storage
        console.log('Using iCloud restore for iOS');
      } else if (platformOS === 'android') {
        // In a real implementation, this would use Google Drive API
        console.log('Using Google Drive restore for Android');
      } else {
        // For web or unknown platforms, use local storage as fallback
        console.log('Using local storage restore for web/unknown platform');
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

  // Sign a message using the private key (placeholder implementation for now)
  const signMessage = async (message: string): Promise<string | null> => {
    try {
      if (!keyPair?.privateKey) {
        console.error('No private key available for signing');
        return null;
      }
      
      // For now, just return a mock signature
      console.log(`Would sign message with private key: ${keyPair.privateKey.substring(0, 10)}...`);
      return `mock-signature-for-${message}`;
    } catch (error) {
      console.error('Error signing message:', error);
      return null;
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
    backupProvider,
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
    enableiCloudBackup,
    backupToiCloud,
    restoreFromiCloud,
    signMessage,
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
