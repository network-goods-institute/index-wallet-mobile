import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Copy, X } from 'lucide-react-native';

export default function ImportWalletScreen(): JSX.Element {
  const { validateSeedPhrase, setOnboardingStep, validateSeedAndCheckWallet, login } = useAuth();
  const { colorScheme } = useTheme();
  const [seedWords, setSeedWords] = useState<string[]>(Array(12).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const inputRefs = useRef<Array<TextInput | null>>(Array(12).fill(null));

  // Handle input change for a specific word
  const handleWordChange = (text: string, index: number) => {
    setError(null);
    const newWords = [...seedWords];
    newWords[index] = text.toLowerCase().trim();
    setSeedWords(newWords);
  };

  // Handle paste from clipboard
  const handlePaste = async () => {
    setError(null);
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      const words = clipboardContent.trim().split(/\s+/);
      
      // Always handle as multi-word paste
      const newWords = [...seedWords];
      words.forEach((word, i) => {
        if (i < 12) {
          newWords[i] = word.toLowerCase().trim();
        }
      });
      setSeedWords(newWords);
      
      // Focus the next empty cell if any
      const nextEmptyIndex = newWords.findIndex((word, idx) => idx > words.length - 1 && !word);
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
      setError('Failed to paste from clipboard');
    }
  };

  const handleClear = () => {
    setSeedWords(Array(12).fill(''));
    setError(null);
    inputRefs.current[0]?.focus();
  };

  const handleImport = async () => {
    setError(null);
    setIsValidating(true);
    
    try {
      const completeSeedPhrase = seedWords.join(' ');

      if (seedWords.some(word => !word)) {
        setError('Please enter all 12 words of your seed phrase');
        return;
      }
      
      if (!validateSeedPhrase(completeSeedPhrase)) {
        setError('Invalid seed phrase format. Please check and try again.');
        return;
      }
      
      // First check if wallet exists in backend
      const wallet = await validateSeedAndCheckWallet(completeSeedPhrase);
      
      if (wallet) {
        console.log('Existing wallet found:', wallet.wallet_address);
        
        // Now perform the actual login which will derive and store the private keys
        console.log('Performing login to derive private keys...');
        const loginSuccess = await login(completeSeedPhrase, false);
        
        if (loginSuccess) {
          console.log('Login successful, private keys derived and stored');
          setOnboardingStep('security-settings');
        } else {
          setError('Failed to complete login process. Please try again.');
        }
      } else {
        setError('No wallet found with this seed phrase. Please check your seed phrase and try again.');
      }
    } catch (error: any) {
      console.error('Error during wallet import:', error);
      setError(error.message || 'Failed to import wallet. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-6">
          <TouchableOpacity onPress={() => setOnboardingStep('welcome')} className="mb-16">
            <ArrowLeft size={32} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>

          <Text className="text-5xl font-bold text-black dark:text-white leading-tight mb-12">
            Enter your{'\n'}seed phrase
          </Text>
        </View>

        <ScrollView className="flex-1 px-6">
          <View className="flex-row flex-wrap justify-between mb-8">
            {seedWords.map((word, index) => (
              <View key={index} className="w-[30%] bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <Text className="text-gray-500 dark:text-gray-400 text-xs absolute top-2 left-2">
                  {(index + 1).toString().padStart(2, '0')}
                </Text>
                <TextInput
                  ref={ref => inputRefs.current[index] = ref}
                  className="text-gray-900 dark:text-white text-lg font-medium text-center mt-2 h-7 bg-transparent"
                  value={word}
                  onChangeText={(text) => handleWordChange(text, index)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(-1)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="..."
                  placeholderTextColor={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'}
                  style={{ outline: 'none' }}
                />
              </View>
            ))}
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
              onPress={() => handlePaste()}
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
            onPress={handleImport}
            disabled={isValidating || seedWords.some(word => !word) || error !== null}
            className={`w-16 h-16 rounded-full items-center justify-center ${
              isValidating || seedWords.some(word => !word) || error !== null
                ? 'bg-gray-200 dark:bg-gray-800'
                : 'bg-yellow-400'
            }`}
          >
            {isValidating ? (
              <ActivityIndicator color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            ) : (
              <ArrowLeft
                size={32}
                color={isValidating || seedWords.some(word => !word) || error !== null
                  ? (colorScheme === 'dark' ? '#4B5563' : '#9CA3AF')
                  : '#000000'
                }
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
