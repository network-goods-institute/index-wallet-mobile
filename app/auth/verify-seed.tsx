import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, X, Copy } from 'lucide-react-native';

export default function VerifySeedScreen() {
  const { seedPhrase, setOnboardingStep, completeOnboarding } = useAuth();
  const { colorScheme } = useTheme();
  const [verificationInputs, setVerificationInputs] = useState<{[key: number]: string}>({});
  const [missingIndices, setMissingIndices] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<{[key: number]: TextInput | null}>({});
  const scrollViewRef = useRef<ScrollView>(null);

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

  const verifyInputs = () => {
    if (seedPhrase) {
      const words = seedPhrase.split(' ');
      return missingIndices.every(idx => 
        verificationInputs[idx] === words[idx]
      );
    }
    return false;
  };

  const areAllInputsFilled = () => {
    return missingIndices.every(idx => verificationInputs[idx]?.length > 0);
  };

  const handleInputChange = (index: number, value: string) => {
    setError(null);
    const newInputs = { ...verificationInputs, [index]: value.toLowerCase().trim() };
    setVerificationInputs(newInputs);
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
          setError(null);
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
    setError(null);
  };

  const handleClearInput = (index: number) => {
    const newInputs = { ...verificationInputs };
    delete newInputs[index];
    setVerificationInputs(newInputs);
    setError(null);
  };

  const handleContinue = async () => {
    if (!areAllInputsFilled()) {
      setError('Please fill in all missing words');
      return;
    }
    
    if (verifyInputs()) {
      if (seedPhrase) {
        // Complete the onboarding process
        const success = await completeOnboarding(seedPhrase, false);
        if (!success) {
          setError('Failed to complete setup. Please try again.');
        }
      }
    } else {
      setError('Incorrect words. Please check and try again.');
    }
  };

  const renderWord = (word: string, index: number) => {
    if (missingIndices.includes(index)) {
      const currentIdx = missingIndices.indexOf(index);
      return (
        <View key={index} className="w-[30%] bg-gray-100 dark:bg-gray-800 rounded-xl p-3 pb-4 mb-4 relative" style={{ minHeight: 72 }}>
          <Text className="text-gray-500 dark:text-gray-400 text-xs absolute top-2 left-2">
            {(index + 1).toString().padStart(2, '0')}
          </Text>
          <TextInput
            ref={(ref) => { inputRefs.current[index] = ref; }}
            className="text-gray-900 dark:text-white text-base font-medium text-center mt-4 bg-transparent"
            value={verificationInputs[index] || ''}
            onChangeText={(text) => handleInputChange(index, text)}
            placeholder="..."
            placeholderTextColor={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType={currentIdx < missingIndices.length - 1 ? "next" : "done"}
            onSubmitEditing={() => {
              if (currentIdx < missingIndices.length - 1) {
                const nextIndex = missingIndices[currentIdx + 1];
                inputRefs.current[nextIndex]?.focus();
              } else {
                Keyboard.dismiss();
                if (areAllInputsFilled()) {
                  handleContinue();
                }
              }
            }}
            onFocus={() => {
              // Scroll to make the input visible when keyboard appears
              setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                  y: Math.floor(index / 3) * 100,
                  animated: true
                });
              }, 300);
            }}
            style={{ outline: 'none', minHeight: 28, paddingVertical: 4 }}
          />
          {verificationInputs[index] && (
            <TouchableOpacity
              onPress={() => handleClearInput(index)}
              className="absolute top-2 right-2"
            >
              <X size={12} color={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'} />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View key={index} className="w-[30%] bg-gray-100 dark:bg-gray-800 rounded-xl p-3 pb-4 mb-4" style={{ minHeight: 72 }}>
        <Text className="text-gray-500 dark:text-gray-400 text-xs absolute top-2 left-2">
          {(index + 1).toString().padStart(2, '0')}
        </Text>
        <Text className="text-gray-900 dark:text-white text-base font-medium text-center mt-4">
          {word}
        </Text>
      </View>
    );
  };

  const words = seedPhrase ? seedPhrase.split(' ') : Array(12).fill('');

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View className="px-6 pt-6">
            <TouchableOpacity onPress={() => setOnboardingStep('create-seed')} className="mb-16">
              <ArrowLeft size={32} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>

            <Text className="text-5xl font-bold text-black dark:text-white leading-tight mb-8">
              Fill in the blanks{'\n'}to verify
            </Text>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            className="flex-1 px-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => Keyboard.dismiss()}
          >
            <View className="flex-row flex-wrap justify-between mb-4">
              {words.map((word, index) => renderWord(word, index))}
            </View>

            {error && (
              <View className="bg-red-900/20 p-4 rounded-xl mb-4">
                <Text className="text-red-400 text-center">{error}</Text>
              </View>
            )}

            <View className="flex-row justify-center gap-4 mb-20">
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

          <View className="px-6 pb-8">
            <TouchableOpacity
              onPress={handleContinue}
              disabled={!areAllInputsFilled()}
              className={`w-full py-4 rounded-2xl items-center justify-center ${
                areAllInputsFilled() ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-800'
              }`}
            >
              <Text className={`text-lg font-semibold ${
                areAllInputsFilled() ? 'text-black' : 'text-gray-500 dark:text-gray-400'
              }`}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}
