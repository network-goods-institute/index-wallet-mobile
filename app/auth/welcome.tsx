import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';

export default function WelcomeScreen() {
  const { startOnboarding, setOnboardingStep } = useAuth();

  const handleCreateWallet = () => {
    startOnboarding();
    setOnboardingStep('create-seed');
  };

  const handleImportWallet = () => {
    startOnboarding();
    setOnboardingStep('import-seed');
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1 p-6 justify-center">
      <View className="items-center mb-12">
        <Text className="text-3xl font-bold text-black dark:text-white mb-2">
          Index Wallets
        </Text>
      </View>

      <View className="gap-8 mx-12">
        <TouchableOpacity 
          className="bg-blue-600 py-4 rounded-xl items-center"
          onPress={handleCreateWallet}
        >
          <Text className="text-white font-semibold text-lg">Create a New Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="border border-gray-300 dark:border-gray-700 py-4 rounded-xl items-center"
          onPress={handleImportWallet}
        >
          <Text className="text-black dark:text-white font-semibold text-lg">Import Existing Wallet</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-12">
        <Text className="text-center text-gray-500 dark:text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
      </SafeAreaView>
    </ThemedView>
  );
}
