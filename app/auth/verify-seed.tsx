import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, X, Copy } from 'lucide-react-native';

export default function VerifySeedScreen() {
  const { seedPhrase, setOnboardingStep } = useAuth();
  const { colorScheme } = useTheme();
  const [verificationInputs, setVerificationInputs] = useState<{[key: number]: string}>({});
  const [missingIndices, setMissingIndices] = useState<number[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    const newInputs = { ...verificationInputs, [index]: value.toLowerCase().trim() };
    setVerificationInputs(newInputs);
    
    if (seedPhrase) {
      const words = seedPhrase.split(' ');
      const allCorrect = missingIndices.every(idx => 
        newInputs[idx] === words[idx]
      );
      setIsVerified(allCorrect);
      
      // If all words are filled but incorrect, show error
      const allFilled = missingIndices.every(idx => newInputs[idx]?.length > 0);
      if (allFilled && !allCorrect) {
        setError('Incorrect words. Please check and try again.');
      }
    }
  };

  const handlePaste = async (index: number) => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      const words = clipboardContent.trim().split(/\s+/);
      
      // If user pastes multiple words
      if (words.length > 1) {
        // If pasting into a specific box, start from that index in missing indices
        const startIdx = index >= 0 ? missingIndices.indexOf(index) : 0;
        if (startIdx >= 0) {
          const newInputs = { ...verificationInputs };
          missingIndices.slice(startIdx).forEach((idx, i) => {
            if (words[i]) {
              newInputs[idx] = words[i].toLowerCase().trim();
            }
          });
          setVerificationInputs(newInputs);
          
          // Verify the pasted words
          if (seedPhrase) {
            const seedWords = seedPhrase.split(' ');
            const allCorrect = missingIndices.every(idx => 
              newInputs[idx] === seedWords[idx]
            );
            setIsVerified(allCorrect);
            
            if (!allCorrect) {
              setError('Incorrect words. Please check and try again.');
            }
          }
        }
      } else {
        // Single word paste
        handleInputChange(index, clipboardContent);
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
    }
  };

  const handleClear = () => {
    setVerificationInputs({});
    setIsVerified(false);
    setError(null);
  };

  const handleClearInput = (index: number) => {
    const newInputs = { ...verificationInputs };
    delete newInputs[index];
    setVerificationInputs(newInputs);
    setIsVerified(false);
    setError(null);
  };

  const handleContinue = () => {
    if (isVerified) {
      setOnboardingStep('create-passkey');
    }
  };

  const renderWord = (word: string, index: number) => {
    if (missingIndices.includes(index)) {
      return (
        <View key={index} className="w-[30%] bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4 relative">
          <Text className="text-gray-500 dark:text-gray-400 text-xs absolute top-2 left-2">
            {(index + 1).toString().padStart(2, '0')}
          </Text>
          <TextInput
            className="text-gray-900 dark:text-white text-lg font-medium text-center mt-2 h-7 bg-transparent"
            value={verificationInputs[index] || ''}
            onChangeText={(text) => handleInputChange(index, text)}
            placeholder="..."
            placeholderTextColor={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ outline: 'none' }}
          />
          <TouchableOpacity
            onPress={() => handlePaste(index)}
            className="absolute top-2 right-2"
          >
            <Copy size={12} color={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View key={index} className="w-[30%] bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4">
        <Text className="text-gray-500 dark:text-gray-400 text-xs absolute top-2 left-2">
          {(index + 1).toString().padStart(2, '0')}
        </Text>
        <Text className="text-gray-900 dark:text-white text-lg font-medium text-center mt-2">
          {word}
        </Text>
      </View>
    );
  };

  const words = seedPhrase ? seedPhrase.split(' ') : Array(12).fill('');

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-6">
          <TouchableOpacity onPress={() => setOnboardingStep('create-seed')} className="mb-16">
            <ArrowLeft size={32} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>

          <Text className="text-5xl font-bold text-black dark:text-white leading-tight mb-12">
            Fill in the blanks{'\n'}to verify
          </Text>
        </View>

        <ScrollView className="flex-1 px-6">
          <View className="flex-row flex-wrap justify-between mb-8">
            {words.map((word, index) => renderWord(word, index))}
          </View>

          {error && (
            <View className="bg-red-900/20 p-4 rounded-xl mb-8">
              <Text className="text-red-400 text-center">{error}</Text>
            </View>
          )}

          <View className="flex-row justify-center gap-4 mb-8">
            <TouchableOpacity
              onPress={handleClear}
              className="flex-row items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gray-100 dark:bg-gray-800"
            >
              <X size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#4B5563'} />
              <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Clear All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handlePaste(-1)}
              className="flex-row items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gray-100 dark:bg-gray-800"
            >
              <Copy size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#4B5563'} />
              <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Paste All
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View className="absolute bottom-12 right-6">
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isVerified}
            className={`w-16 h-16 rounded-full items-center justify-center ${
              isVerified ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-800'
            }`}
          >
            <ArrowLeft
              size={32}
              color={isVerified ? '#000000' : (colorScheme === 'dark' ? '#4B5563' : '#9CA3AF')}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
