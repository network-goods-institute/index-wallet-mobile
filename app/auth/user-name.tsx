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
    setOnboardingStep('create-seed');
  };

  return (
    <ThemedView className="flex-1 bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <View className="px-6 pt-6">
            <TouchableOpacity onPress={handleBack} className="mb-16">
              <ArrowLeft size={32} color={isVendor ? '#2196F3' : '#9C27B0'} />
            </TouchableOpacity>

            <Text className="text-5xl font-bold text-white leading-tight">
              {isVendor 
                ? "What is your\nvendor name?"
                : "What is your\nname?"
              }
            </Text>
          </View>

          <View className="flex-1 px-6 pt-16">
            <TextInput
              className="text-white text-3xl font-medium py-4"
              placeholder={isVendor ? "Enter business name" : "Enter your name"}
              placeholderTextColor="#666"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
              autoFocus
              autoCapitalize="words"
              selectionColor={isVendor ? '#2196F3' : '#9C27B0'}
            />

            {error ? (
              <Text className="text-red-500 text-lg mt-4">{error}</Text>
            ) : null}

            <View className="absolute bottom-12 left-6 right-6">
              <TouchableOpacity
                onPress={handleContinue}
                className={`${isVendor ? 'bg-blue-600' : 'bg-purple-600'} p-5 rounded-2xl`}
              >
                <Text className="text-white font-bold text-center text-xl">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
