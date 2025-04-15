import React from 'react';
import { Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { View, Text } from '@/components/Themed';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';

const WelcomeScreen = () => {
  const { startOnboarding, setOnboardingStep } = useAuth();

  const handleCreateWallet = () => {
    startOnboarding();
    setOnboardingStep('user-type');
  };

  const handleImportWallet = () => {
    startOnboarding();
    setOnboardingStep('import-seed');
  };
  
  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1 mx-12 p-6 justify-center">
        <Image
          source={require('@/assets/images/Logo.png')}
          style={{ resizeMode: 'contain', width: 200, height: 200 }}
        />

      <View className="my-24 items-center">
        <Text 
          className="text-5xl font-bold text-center text-yellow-900 dark:text-yellow-400"
        >
          Index Wallets
        </Text>
      </View>

      <View className="flex-1 justify-end">
        <View className="gap-8">
          <TouchableOpacity 
            className="bg-blue-600 py-4 px-6 rounded-xl items-center"
            onPress={handleCreateWallet}
          >
            <Text 
              className="text-base font-medium text-white"
            >
              Create a New Wallet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="border border-gray-300 dark:border-gray-700 py-4 px-6 rounded-xl items-center"
            onPress={handleImportWallet}
          >
            <Text 
              className="text-base font-medium text-gray-900 dark:text-white"
            >
              Import Existing Wallet
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      <View className="mt-12">
        <StyledText 
          variant="caption" 
          className="text-xs font-light text-center text-gray-500 dark:text-gray-400"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </StyledText>
      </View>
      </SafeAreaView>
    </ThemedView>
  );
};

export default WelcomeScreen;
