import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedView } from '@/components/core/ThemedView';
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
  const scrollViewRef = useRef<ScrollView>(null);

  // Handle input change for a specific word
  const handleWordChange = (text: string, index: number) => {
    setError(null);
    const newWords = [...seedWords];
    newWords[index] = text.toLowerCase().trim();
    setSeedWords(newWords);
    
    // Auto-focus next input if space is typed
    if (text.includes(' ') && index < 11) {
      const cleanWord = text.trim();
      newWords[index] = cleanWord;
      setSeedWords(newWords);
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 50);
    }
  };

  // Handle paste from clipboard
  const handlePaste = async () => {
    setError(null);
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      const pastedWords = clipboardContent.trim().split(/\s+/).filter(word => word.length > 0);
      let newWords: string[] = [];
      
      console.log('Pasted words:', pastedWords);
      console.log('Current seed words:', seedWords);
      console.log('Pasted words length:', pastedWords.length);
      
      // Check if pasted content is exactly 12 words (full seed phrase)
      if (pastedWords.length === 12) {
        // Smart paste: only fill empty slots with the corresponding word from the pasted phrase
        newWords = [...seedWords];
        
        for (let i = 0; i < 12; i++) {
          // If current slot is empty, use the word from the same position in the pasted phrase
          if (!newWords[i] || newWords[i].trim() === '') {
            newWords[i] = pastedWords[i].toLowerCase().trim();
          }
        }
        console.log('Smart paste result:', newWords);
        setSeedWords(newWords);
      } else {
        // Not a full seed phrase, just paste normally (overwrite from beginning)
        newWords = [...seedWords];
        pastedWords.forEach((word, i) => {
          if (i < 12) {
            newWords[i] = word.toLowerCase().trim();
          }
        });
        console.log('Normal paste result:', newWords);
        setSeedWords(newWords);
      }
      
      // Focus the next empty cell if any
      const nextEmptyIndex = newWords.findIndex((word: string) => !word || word.trim() === '');
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
    // Set loading state immediately for instant feedback
    setIsValidating(true);
    setError(null);
    
    // Small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Now do validation
    if (seedWords.some(word => !word)) {
      setError('Please enter all 12 words of your seed phrase');
      setIsValidating(false);
      return;
    }
    
    try {
      const completeSeedPhrase = seedWords.join(' ');
      
      if (!validateSeedPhrase(completeSeedPhrase)) {
        setError('Invalid seed phrase format. Please check and try again.');
        setIsValidating(false);
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
          setOnboardingStep('complete');
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
        <KeyboardAvoidingView 
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View className="px-6 pt-6">
            <TouchableOpacity onPress={() => setOnboardingStep('welcome')} className="mb-6">
              <ArrowLeft size={32} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            className="flex-1 px-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => Keyboard.dismiss()}
          >
            <Text className="text-5xl font-bold text-black dark:text-white leading-tight mb-8">
              Enter your{'\n'}seed phrase
            </Text>
            
            <View className="flex-row flex-wrap justify-between mb-4">
              {seedWords.map((word, index) => (
                <View key={index} className="w-[30%] bg-gray-100 dark:bg-gray-800 rounded-xl p-3 pb-4 mb-4 relative" style={{ minHeight: 72 }}>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs absolute top-2 left-2">
                    {(index + 1).toString().padStart(2, '0')}
                  </Text>
                  <TextInput
                    ref={ref => {
                      inputRefs.current[index] = ref;
                    }}
                    className="text-gray-900 dark:text-white text-base font-medium text-center mt-4 bg-transparent"
                    value={word}
                    onChangeText={(text) => handleWordChange(text, index)}
                    onFocus={() => {
                      setFocusedIndex(index);
                      // Scroll to make the input visible
                      setTimeout(() => {
                        scrollViewRef.current?.scrollTo({
                          y: Math.floor(index / 3) * 80,
                          animated: true
                        });
                      }, 300);
                    }}
                    onBlur={() => setFocusedIndex(-1)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    returnKeyType={index < 11 ? "next" : "done"}
                    onSubmitEditing={() => {
                      if (index < 11) {
                        inputRefs.current[index + 1]?.focus();
                      } else {
                        Keyboard.dismiss();
                      }
                    }}
                    placeholder="..."
                    placeholderTextColor={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'}
                    style={{ outline: 'none', minHeight: 28, paddingVertical: 4 }}
                  />
                  {word && (
                    <TouchableOpacity
                      onPress={() => {
                        const newWords = [...seedWords];
                        newWords[index] = '';
                        setSeedWords(newWords);
                      }}
                      className="absolute top-2 right-2"
                    >
                      <X size={12} color={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

          {error && (
            <View className="bg-red-900/20 p-4 rounded-xl mb-8">
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

          <View className="px-6 pb-8">
            <TouchableOpacity
              onPress={handleImport}
              disabled={isValidating || seedWords.some(word => !word)}
              activeOpacity={0.8}
              className={`w-full py-4 rounded-2xl items-center justify-center ${
                isValidating || seedWords.some(word => !word)
                  ? 'bg-gray-200 dark:bg-gray-800'
                  : 'bg-yellow-400'
              }`}
              style={{
                transform: [{scale: isValidating ? 0.98 : 1}]
              }}
            >
              {isValidating ? (
                <ActivityIndicator color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              ) : (
                <Text className={`text-lg font-semibold ${
                  isValidating || seedWords.some(word => !word) || error !== null
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-black'
                }`}>
                  Import Wallet
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}
