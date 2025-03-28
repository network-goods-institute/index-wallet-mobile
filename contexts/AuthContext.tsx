import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types
export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'onboarding';
export type OnboardingStep = 'welcome' | 'create-seed' | 'verify-seed' | 'import-seed' | 'create-passkey' | 'complete';

interface AuthContextType {
  status: AuthStatus;
  onboardingStep: OnboardingStep;
  seedPhrase: string | null;
  hasPasskey: boolean;
  
  // Authentication methods
  login: (seedPhrase: string, usePasskey?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  authenticateWithPasskey: () => Promise<boolean>;
  
  // Seed phrase methods
  generateSeedPhrase: () => string;
  validateSeedPhrase: (phrase: string) => boolean;
  
  // Onboarding methods
  startOnboarding: () => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  completeOnboarding: (seedPhrase: string, usePasskey: boolean) => Promise<boolean>;
}

// Storage keys
const AUTH_STATUS_KEY = 'auth-status';
const SEED_PHRASE_KEY = 'encrypted-seed-phrase';
const HAS_PASSKEY_KEY = 'has-passkey';

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
  const [hasPasskey, setHasPasskey] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user has completed onboarding
        const storedStatus = await AsyncStorage.getItem(AUTH_STATUS_KEY);
        const storedHasPasskey = await AsyncStorage.getItem(HAS_PASSKEY_KEY);
        
        if (storedStatus === 'authenticated') {
          setStatus('authenticated');
          setHasPasskey(storedHasPasskey === 'true');
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

  // Complete the onboarding process
  const completeOnboarding = async (seedPhrase: string, usePasskey: boolean): Promise<boolean> => {
    try {
      // Encrypt and store the seed phrase (in a real app, use proper encryption)
      await AsyncStorage.setItem(SEED_PHRASE_KEY, seedPhrase);
      await AsyncStorage.setItem(HAS_PASSKEY_KEY, usePasskey ? 'true' : 'false');
      await AsyncStorage.setItem(AUTH_STATUS_KEY, 'authenticated');
      
      setSeedPhrase(seedPhrase);
      setHasPasskey(usePasskey);
      setStatus('authenticated');
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  };

  // Login with seed phrase
  const login = async (inputSeedPhrase: string, usePasskey: boolean = false): Promise<boolean> => {
    try {
      // For mock implementation, we'll accept any of our mock seed phrases
      if (!validateSeedPhrase(inputSeedPhrase)) {
        return false;
      }
      
      // Store the seed phrase
      await AsyncStorage.setItem(SEED_PHRASE_KEY, inputSeedPhrase);
      await AsyncStorage.setItem(HAS_PASSKEY_KEY, usePasskey ? 'true' : 'false');
      await AsyncStorage.setItem(AUTH_STATUS_KEY, 'authenticated');
      
      setSeedPhrase(inputSeedPhrase);
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
        // Retrieve the seed phrase
        const storedSeedPhrase = await AsyncStorage.getItem(SEED_PHRASE_KEY);
        if (storedSeedPhrase) {
          setSeedPhrase(storedSeedPhrase);
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

  const value = {
    status,
    onboardingStep,
    seedPhrase,
    hasPasskey,
    
    login,
    logout,
    authenticateWithPasskey,
    
    generateSeedPhrase,
    validateSeedPhrase,
    
    startOnboarding,
    setOnboardingStep,
    completeOnboarding,
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
