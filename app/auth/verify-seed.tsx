import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react-native';

export default function VerifySeedScreen() {
  const { seedPhrase, setOnboardingStep } = useAuth();
  const [verificationInputs, setVerificationInputs] = useState<{[key: number]: string}>({});
  const [missingIndices, setMissingIndices] = useState<number[]>([]);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (seedPhrase) {
      // Generate 3 random indices to verify
      const indices = generateRandomIndices(3, 12);
      setMissingIndices(indices);
    }
  }, [seedPhrase]);

  const generateRandomIndices = (n: number, max: number): number[] => {
    const indices: number[] = [];
    while (indices.length < n) {
      const index = Math.floor(Math.random() * max);
      if (!indices.includes(index)) {
        indices.push(index);
      }
    }
    return indices.sort((a, b) => a - b);
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = { ...verificationInputs, [index]: value.toLowerCase().trim() };
    setVerificationInputs(newInputs);
    
    if (seedPhrase) {
      const words = seedPhrase.split(' ');
      const allCorrect = missingIndices.every(idx => 
        newInputs[idx] === words[idx]
      );
      setIsVerified(allCorrect);
    }
  };

  const handleContinue = () => {
    if (isVerified) {
      setOnboardingStep('create-passkey');
    }
  };

  const renderWord = (word: string, index: number) => {
    if (missingIndices.includes(index)) {
      return (
        <View key={index} className="w-[30%] bg-gray-800 rounded-xl p-4 mb-4">
          <Text className="text-gray-400 text-xs absolute top-2 left-2">
            {(index + 1).toString().padStart(2, '0')}
          </Text>
          <TextInput
            className="text-white text-lg font-medium text-center mt-2 h-7 bg-transparent"
            value={verificationInputs[index] || ''}
            onChangeText={(text) => handleInputChange(index, text)}
            placeholder="..."
            placeholderTextColor="#4B5563"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ outline: 'none' }}
          />
        </View>
      );
    }

    return (
      <View key={index} className="w-[30%] bg-gray-800 rounded-xl p-4 mb-4">
        <Text className="text-gray-400 text-xs absolute top-2 left-2">
          {(index + 1).toString().padStart(2, '0')}
        </Text>
        <Text className="text-white text-lg font-medium text-center mt-2">
          {word}
        </Text>
      </View>
    );
  };

  const words = seedPhrase ? seedPhrase.split(' ') : Array(12).fill('');

  return (
    <ThemedView className="flex-1 bg-black">
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-6">
          <TouchableOpacity onPress={() => setOnboardingStep('create-seed')} className="mb-16">
            <ArrowLeft size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="text-5xl font-bold text-white leading-tight mb-12">
            Fill in the blanks to verify
          </Text>
        </View>

        <ScrollView className="flex-1 px-6">
          <View className="flex-row flex-wrap justify-between mb-16">
            {words.map((word, index) => renderWord(word, index))}
          </View>
        </ScrollView>

        <View className="absolute bottom-12 left-6">
          <TouchableOpacity
            onPress={() => setOnboardingStep('create-seed')}
            className="w-16 h-16 rounded-full items-center justify-center bg-gray-800/50"
          >
            <ArrowLeft size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View className="absolute bottom-12 right-6">
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isVerified}
            className={`w-16 h-16 rounded-full items-center justify-center ${
              isVerified ? 'bg-yellow-400' : 'bg-gray-600'
            }`}
          >
            <ArrowLeft size={32} color="#000000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
