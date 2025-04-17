import React from 'react';
import { Image, TouchableOpacity, SafeAreaView, Text, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { StyledText } from '@/components/StyledText';
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
        <View className="my-48 items-center">
          <Image
            source={require('@/assets/images/Logo.png')}
            className="w-50 h-50 my-12"
          />

          <Text 
            className="text-5xl font-black text-center text-yellow-900 dark:text-yellow-400"
            style={{ fontFamily: 'SF-Pro-Rounded-Black' }}
          >
            Index Wallets
          </Text>
        </View>

        <View className="flex-1 justify-end">
          <View className="gap-4">
            <TouchableOpacity 
              className="bg-blue-600 py-4 px-6 rounded-xl items-center"
              onPress={handleCreateWallet}
            >
              <Text 
                className="text-base font-semibold text-white"
                style={{ fontFamily: 'SF-Pro-Rounded-Bold' }}
              >
                Create a New Wallet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="border border-gray-300 dark:border-gray-700 py-4 px-6 rounded-xl items-center"
              onPress={handleImportWallet}
            >
              <Text 
                className="text-base font-semibold text-black dark:text-white"
                style={{ fontFamily: 'SF-Pro-Rounded-Bold' }}
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
