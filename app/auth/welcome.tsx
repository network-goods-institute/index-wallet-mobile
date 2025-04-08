import React from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { StyledText } from '@/components/StyledText';

const styles = StyleSheet.create({
  title: {
    color: '#000',
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
  },
  termsText: {
    textAlign: 'center',
    color: '#6b7280',
  },
});

export default function WelcomeScreen() {
  const { startOnboarding, setOnboardingStep } = useAuth();

  const handleCreateWallet = () => {
    startOnboarding();
    setOnboardingStep('user-type');
  };

  const handleImportWallet = () => {
    startOnboarding();
    setOnboardingStep('import-seed');

  };

  //TODO: Add shimmer on base logo
  // Stylistic changes: 


  // Need to differentiate between vendor and payment wallets: 
  // Does schema change at all: 
      // Only onboarding flow: 
  // Vendor wallets: 
  //  
  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1 p-6 justify-center">
      <View className="items-center mb-12">
        <StyledText 
          variant="h1" 
          weight="bold" 
          style={styles.title}
        >
          Index Wallets
        </StyledText>
      </View>

      <View className="gap-8 mx-12">
        <TouchableOpacity 
          className="bg-blue-600 py-4 rounded-xl items-center"
          onPress={handleCreateWallet}
        >
          <StyledText 
            variant="button" 
            weight="medium" 
            style={styles.buttonText}
          >
            Create a New Wallet
          </StyledText>
        </TouchableOpacity>

        <TouchableOpacity 
          className="border border-gray-300 dark:border-gray-700 py-4 rounded-xl items-center"
          onPress={handleImportWallet}
        >
          <StyledText 
            variant="button" 
            weight="medium" 
            style={styles.buttonText}
          >
            Import Existing Wallet
          </StyledText>
        </TouchableOpacity>
      </View>

      <View className="mt-12">
        <StyledText 
          variant="caption" 
          style={styles.termsText}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </StyledText>
      </View>
      </SafeAreaView>
    </ThemedView>
  );
}
