import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Store, ShoppingBag } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { height } = Dimensions.get('window');

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
    <ThemedView className="flex-1 bg-white dark:bg-black">
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-6">
          <TouchableOpacity onPress={handleBack} className="mb-8">
            <ArrowLeft size={32} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />          
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6">
          <Animated.View 
            entering={FadeInDown.delay(100).springify().damping(18).stiffness(200)}
          >
            <Text className="text-5xl font-bold text-black dark:text-white leading-tight mb-2">
              I am a
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-lg mb-12">
              Choose how you'll primarily use Index Wallets
            </Text>
          </Animated.View>

          <View className="flex-1 justify-center" style={{ marginTop: -height * 0.1 }}>
            <Animated.View 
              entering={FadeInDown.delay(200).springify().damping(18).stiffness(200)}
              className="mb-4"
            >
              <TouchableOpacity
                onPress={handleVendorSelection}
                className="bg-gray-100 dark:bg-gray-900 p-6 rounded-3xl border-2 border-transparent active:border-blue-500"
                activeOpacity={0.9}
              >
                <View className="flex-row items-center mb-3">
                  <View className="bg-blue-500 p-3 rounded-2xl">
                    <Store size={24} color="#FFFFFF" />
                  </View>
                  <Text className="text-2xl font-semibold text-black dark:text-white ml-4">
                    Vendor
                  </Text>
                </View>
                <Text className="text-gray-600 dark:text-gray-400 text-base ml-14">
                  Accept payments and reward customers who support your values
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(300).springify().damping(18).stiffness(200)}
            >
              <TouchableOpacity
                onPress={handlePayeeSelection}
                className="bg-gray-100 dark:bg-gray-900 p-6 rounded-3xl border-2 border-transparent active:border-purple-500"
                activeOpacity={0.9}
              >
                <View className="flex-row items-center mb-3">
                  <View className="bg-purple-600 p-3 rounded-2xl">
                    <ShoppingBag size={24} color="#FFFFFF" />
                  </View>
                  <Text className="text-2xl font-semibold text-black dark:text-white ml-4">
                    Customer
                  </Text>
                </View>
                <Text className="text-gray-600 dark:text-gray-400 text-base ml-14">
                  Shop with your values and save at merchants who share them
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.Text 
            entering={FadeInDown.delay(400).springify().damping(18).stiffness(200)}
            className="text-center text-gray-500 dark:text-gray-500 text-sm mb-8"
          >
            You can switch modes anytime in settings
          </Animated.Text>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
