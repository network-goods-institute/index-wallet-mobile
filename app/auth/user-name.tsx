import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react-native';

export default function UserNameScreen() {
  const { setOnboardingStep, userType, setUserName } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const isVendor = userType === 'vendor';

  const handleBack = () => {
    if (isVendor) {
      setOnboardingStep('vendor-slides');
    } else {
      setOnboardingStep('customer-slides');
    }
  };

  const handleContinue = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setUserName(name.trim());
    
    // Navigate to vendor-details for vendors, create-seed for customers
    if (isVendor) {
      setOnboardingStep('vendor-details');
    } else {
      setOnboardingStep('create-seed');
    }
  };

  return (
    <ThemedView className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View className="flex-1">
            {/* Header */}
            <View className="px-6 pt-4">
              <TouchableOpacity onPress={handleBack} className="mb-8">
                <ArrowLeft size={32} color={isVendor ? '#2196F3' : '#9C27B0'} />
              </TouchableOpacity>

              <Text className="text-4xl font-bold text-gray-900 leading-tight mb-6">
                {isVendor 
                  ? "What is your\nbusiness name?"
                  : "What is your\nname?"
                }
              </Text>
            </View>

            {/* Content area with input */}
            <View className="flex-1 px-6">
              {/* Disclaimer text above input */}
              <Text className="text-gray-400 text-sm mb-3">
                {isVendor 
                  ? "Customers will be able to see your store name on transactions"
                  : "Merchants will be able to see your username on transactions"
                }
              </Text>

              {/* Input field */}
              <TextInput
                className="text-gray-900 text-2xl font-medium py-3 focus:outline-none"
                placeholder={isVendor ? "Enter business name" : "Enter your name"}
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (error) setError('');
                }}
                autoFocus
                autoCapitalize="words"
                selectionColor={isVendor ? '#2196F3' : '#9C27B0'}
                style={Platform.OS === 'web' ? { outline: 'none' } : {}}
              />

              {error ? (
                <Text className="text-red-500 text-base mt-3">{error}</Text>
              ) : null}
            </View>

            {/* Continue button - fixed at bottom with proper spacing */}
            <View className="px-6 pb-6">
              <TouchableOpacity
                onPress={handleContinue}
                className={`${isVendor ? 'bg-blue-600' : 'bg-purple-600'} p-4 rounded-2xl`}
              >
                <Text className="text-white font-bold text-center text-lg">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}