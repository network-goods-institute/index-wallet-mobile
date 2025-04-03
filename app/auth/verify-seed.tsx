import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';

export default function VerifySeedScreen() {
  const { seedPhrase, setOnboardingStep, completeOnboarding } = useAuth();
  const [selectedWords, setSelectedWords] = useState<{word: string, originalIndex: number}[]>([]);
  const [availableWords, setAvailableWords] = useState<{word: string, index: number}[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  
  // Prepare the verification challenge
  useEffect(() => {
    if (seedPhrase) {
      const words = seedPhrase.split(' ');
      
      // Select 4 random words to verify (indices 0-based)
      const indicesToVerify = generateRandomIndices(4, words.length);
      
      // Create shuffled array of words for selection
      const shuffled = [...words].map((word, index) => ({ word, index }));
      shuffleArray(shuffled);
      
      setAvailableWords(shuffled);
    }
  }, [seedPhrase]);

  // Generate n random unique indices between 0 and max-1
  const generateRandomIndices = (n: number, max: number): number[] => {
    const indices: number[] = [];
    while (indices.length < n) {
      const index = Math.floor(Math.random() * max);
      if (!indices.includes(index)) {
        indices.push(index);
      }
    }
    return indices.sort((a, b) => a - b); // Sort in ascending order
  };

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  const handleWordSelect = (word: string, index: number) => {
    // Add word to selected words
    const newSelected = [...selectedWords, { word, originalIndex: index }];
    setSelectedWords(newSelected);
    
    // Remove word from available words
    setAvailableWords(availableWords.filter(item => item.index !== index));
    
    // Check if all required words are selected
    if (newSelected.length === 4) {
      verifySelection(newSelected);
    }
  };

  const verifySelection = (selected: {word: string, originalIndex: number}[]) => {
    if (!seedPhrase) return;
    
    const seedWords = seedPhrase.split(' ');
    const isCorrect = selected.every(item => seedWords[item.originalIndex] === item.word);
    
    if (isCorrect) {
      setIsVerified(true);
      Alert.alert(
        'Verification Successful',
        'You have successfully verified your seed phrase.',
        [{ text: 'Continue', onPress: handleContinue }]
      );
    } else {
      Alert.alert(
        'Verification Failed',
        'The selected words do not match your seed phrase. Please try again.',
        [{ text: 'Try Again', onPress: resetVerification }]
      );
    }
  };

  const resetVerification = () => {
    if (seedPhrase) {
      const words = seedPhrase.split(' ');
      const shuffled = [...words].map((word, index) => ({ word, index }));
      shuffleArray(shuffled);
      
      setSelectedWords([]);
      setAvailableWords(shuffled);
      setIsVerified(false);
    }
  };

  const handleContinue = async () => {
    if (isVerified && seedPhrase) {
      setOnboardingStep('create-passkey');
    }
  };

  return (
    <ThemedView className="flex-1 m-4">
      <SafeAreaView className="flex-1 p-8">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={() => setOnboardingStep('create-seed')} className="mr-4">
            <ArrowLeft size={24} className="text-black dark:text-white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-black dark:text-white">Verify Seed Phrase</Text>
        </View>

        <ScrollView className="flex-1 mx-2">
          <View className="mb-8">
            <Text className="text-lg font-semibold text-black dark:text-white mb-2">
              Confirm Your Recovery Phrase
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mb-6">
              Select the correct words from your seed phrase to verify you've saved it properly.
            </Text>

            {/* Selected words section */}
            <View className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 mb-5">
              <Text className="text-gray-600 dark:text-gray-400 mb-3">Selected Words:</Text>
              <View className="flex-row flex-wrap">
                {selectedWords.map((item, idx) => (
                  <View key={idx} className="bg-blue-100 dark:bg-blue-900 rounded-lg px-3 py-2 m-1">
                    <Text className="text-blue-800 dark:text-blue-200">{item.word}</Text>
                  </View>
                ))}
                {Array(4 - selectedWords.length).fill(0).map((_, idx) => (
                  <View key={`empty-${idx}`} className="bg-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2 m-1 min-w-[80px]">
                    <Text className="text-gray-400 dark:text-gray-500">...</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Available words section */}
            <View className="mb-8">
              <Text className="text-gray-600 dark:text-gray-400 mb-3">Select 4 words from your seed phrase:</Text>
              <View className="flex-row flex-wrap justify-between">
                {availableWords.map((item, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    className="bg-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2 m-1 min-w-[30%]"
                    onPress={() => handleWordSelect(item.word, item.index)}
                    disabled={selectedWords.length >= 4}
                  >
                    <Text className="text-center text-black dark:text-white">{item.word}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity 
          className={`py-4 rounded-xl items-center mb-6 mx-2 ${
            isVerified ? 'bg-blue-600' : 'bg-gray-400'
          }`}
          onPress={handleContinue}
          disabled={!isVerified}
        >
          <Text className="text-white font-semibold text-lg">
            {isVerified ? 'Continue' : 'Verify Seed Phrase'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ThemedView>
  );
}
