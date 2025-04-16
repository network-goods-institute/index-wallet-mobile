import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Store, CreditCard } from 'lucide-react-native';

export default function UserTypeScreen() {
  const { setOnboardingStep, setUserType } = useAuth();
  const { colorScheme } = useTheme();

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
      <SafeAreaView className="flex-1 p-12 m-8">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={handleBack} className="mr-4">
            <ArrowLeft size={32} className="text-black dark:text-white" />          
          </TouchableOpacity>
          <Text className="text-3xl font-black text-black dark:text-white">
            I am a...
          </Text>
        </View>

        <View className="flex-1 justify-center gap-8">
          <TouchableOpacity
            onPress={handleVendorSelection}
            className="bg-teal-500 p-6 rounded-xl flex flex-row items-center"
          >
            <Store size={40} color="#064E3B" />
            <View className="ml-4 flex flex-col">
            <Text className="text-2xl font-bold text-white">
                Vendor
              </Text>
            <Text className="text-sm font-light text-white mt-1">
                I primarily accept payments from customers
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePayeeSelection}
            className="bg-indigo-500 p-6 rounded-xl flex flex-row items-center"
          >
            <CreditCard size={40} color="#4B0082" />
            <View className="ml-4 flex flex-col">
            <Text className="text-2xl font-bold text-white">
                Customer
              </Text>
            <Text className="text-sm font-light text-white mt-1">
                I primarily make payments to vendors
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text className="text-center font-light text-gray-600 dark:text-gray-400 mt-6">
          You can change this later in settings
        </Text>
      </SafeAreaView>
    </ThemedView>
  );
}
