import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react-native';

export default function UserTypeScreen() {
  const { setOnboardingStep, setUserType } = useAuth();

  const handleVendorSelection = () => {
    setUserType('vendor');
    setOnboardingStep('vendor-slides');
  };

  const handlePayeeSelection = () => {
    setUserType('payee');
    setOnboardingStep('customer-slides');
  };

  const handleBack = () => {
    setOnboardingStep('welcome');
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1 p-6">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={handleBack} className="mr-4">
            <ArrowLeft size={24} className="text-black dark:text-white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-black dark:text-white">I am a...</Text>
        </View>

        <View className="flex-1 justify-center space-y-6">
          <TouchableOpacity
            onPress={handleVendorSelection}
            className="bg-blue-600 p-6 rounded-xl"
          >
            <Text className="text-xl font-bold text-white">Vendor</Text>
            <Text className="text-white opacity-80 mt-1">I want to accept payments from customers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePayeeSelection}
            className="bg-green-600 p-6 rounded-xl"
          >
            <Text className="text-xl font-bold text-white">Customer</Text>
            <Text className="text-white opacity-80 mt-1">I want to make payments to vendors</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-gray-500 dark:text-gray-400 mt-6">
          You can change this later in settings
        </Text>
      </SafeAreaView>
    </ThemedView>
  );
}
