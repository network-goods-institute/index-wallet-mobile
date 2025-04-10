import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react-native';

export default function UserNameScreen() {
  const { setOnboardingStep, userType, setUserName } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleBack = () => {
    // Go back to the appropriate slides based on user type
    if (userType === 'vendor') {
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
    
    // Proceed to seed phrase creation
    setOnboardingStep('create-seed');
  };

  return (
    <ThemedView className="flex-1">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 p-6">
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={handleBack} className="mr-4">
              <ArrowLeft size={24} className="text-black dark:text-white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-black dark:text-white">What's your name?</Text>
          </View>

          <View className="flex-1 justify-center space-y-6">
            <Text className="text-base text-gray-700 dark:text-gray-300">
              Please enter your name so we can personalize your experience
            </Text>

            <TextInput
              className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-black dark:text-white text-lg"
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
            />

            {error ? (
              <Text className="text-red-500">{error}</Text>
            ) : null}

            <TouchableOpacity
              onPress={handleContinue}
              className="bg-blue-600 p-4 rounded-xl mt-6"
            >
              <Text className="text-white font-bold text-center text-lg">Continue</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
