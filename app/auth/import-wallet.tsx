import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, SafeAreaView, Clipboard, Keyboard, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Clipboard as ClipboardIcon } from 'lucide-react-native';
import { validateAndFetchWallet } from '@/services/walletService';

export default function ImportWalletScreen() {
  const { validateSeedPhrase, login, setOnboardingStep, setSeedPhraseForOnboarding } = useAuth();
  const [seedWords, setSeedWords] = useState<string[]>(Array(12).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [existingWallet, setExistingWallet] = useState<any>(null);
  const inputRefs = useRef<Array<TextInput | null>>(Array(12).fill(null));

  // Focus next input after entering a word
  const focusNextInput = (index: number) => {
    if (index < 11) {
      inputRefs.current[index + 1]?.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  // Handle input change for a specific word
  const handleWordChange = (text: string, index: number) => {
    // Check if the text contains a space
    if (text.includes(' ')) {
      // Split by space and take only the first word
      const firstWord = text.split(' ')[0].trim().toLowerCase();
      const newWords = [...seedWords];
      newWords[index] = firstWord;
      setSeedWords(newWords);
      
      // Move to next input after processing the space
      focusNextInput(index);
    } else {
      // Just update the current word without advancing
      const newWords = [...seedWords];
      newWords[index] = text.toLowerCase();
      setSeedWords(newWords);
    }
  };

  // Handle paste from clipboard
  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      const words = clipboardContent.trim().split(/\s+/);
      
      if (words.length === 12) {
        setSeedWords(words.map(word => word.toLowerCase()));
        Keyboard.dismiss();
      } else {
        setError('Invalid seed phrase format. Please ensure it contains exactly 12 words.');
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
      setError('Failed to paste from clipboard');
    }
  };

  const handleImport = async () => {
    setError(null);
    setIsValidating(true);
    
    try {
      // Join words to create the seed phrase
      const completeSeedPhrase = seedWords.join(' ');

      // Basic validation
      if (seedWords.some(word => !word)) {
        setError('Please enter all 12 words of your seed phrase');
        setIsValidating(false);
        return;
      }
      
      // Check if it's a valid BIP39 seed phrase
      if (!validateSeedPhrase(completeSeedPhrase)) {
        setError('Invalid seed phrase format. Please check and try again.');
        setIsValidating(false);
        return;
      }
      
      // Validate the seed phrase with the backend and check if a wallet already exists
      const wallet = await validateAndFetchWallet(completeSeedPhrase);
      
      // If a wallet was found, store it for later use
      if (wallet) {
        setExistingWallet(wallet);
        console.log('Found existing wallet:', wallet.wallet_address);
        
        // Show confirmation to the user
        Alert.alert(
          'Existing Wallet Found',
          'We found an existing wallet associated with this seed phrase. Would you like to restore it?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsValidating(false)
            },
            {
              text: 'Restore',
              onPress: async () => {
                try {
                  // Save the seed phrase and existing wallet info for use in the security settings screen
                  await setSeedPhraseForOnboarding(completeSeedPhrase);
                  
                  // Proceed to security settings screen
                  setOnboardingStep('create-passkey');
                } catch (error) {
                  console.error('Failed to store seed phrase:', error);
                  setError('Failed to import wallet. Please try again.');
                  setIsValidating(false);
                }
              }
            }
          ]
        );
      } else {
        // No existing wallet found, proceed with creating a new one
        console.log('No existing wallet found, will create a new one');
        
        // Store the seed phrase in the context but don't complete onboarding yet
        // We'll redirect to the security settings screen first
        try {
          // Save the seed phrase for use in the security settings screen
          await setSeedPhraseForOnboarding(completeSeedPhrase);
          
          // Proceed to security settings screen
          setOnboardingStep('create-passkey');
        } catch (error) {
          console.error('Failed to store seed phrase:', error);
          setError('Failed to import wallet. Please try again.');
        }
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
      <SafeAreaView className="flex-1 p-6 m-4">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={() => setOnboardingStep('welcome')} className="mr-4">
            <ArrowLeft size={24} className="text-black dark:text-white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-black dark:text-white">Import Wallet</Text>
        </View>

        <ScrollView className="flex-1">
          <View className="mb-8 mx-2">
            <Text className="text-lg font-semibold text-black dark:text-white mb-2">
              Enter Your Recovery Seed Phrase
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mb-6">
              Enter your 12-word recovery phrase in the correct order to restore your wallet.
            </Text>

            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-black dark:text-white font-medium">Enter your 12 words</Text>
              <TouchableOpacity 
                className="flex-row items-center bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg" 
                onPress={handlePaste}
              >
                <ClipboardIcon size={16} className="text-black dark:text-white mr-4" />
                <Text className="text-black dark:text-white text-sm ml-2">Paste</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-5">
              <View className="flex-row flex-wrap justify-between">
                {seedWords.map((word, index) => (
                  <View key={index} className="w-[32%] mb-3">
                    <View className={`bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden ${focusedIndex === index ? 'border-2 border-blue-500' : 'border border-gray-300 dark:border-gray-600'}`}>
                      <TextInput
                        ref={ref => inputRefs.current[index] = ref}
                        className="text-black dark:text-white text-base p-2"
                        value={word}
                        onChangeText={(text) => handleWordChange(text, index)}
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() => setFocusedIndex(-1)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        returnKeyType={index < 11 ? 'next' : 'done'}
                        onSubmitEditing={() => focusNextInput(index)}
                        blurOnSubmit={index === 11}
                        placeholder={` ${index + 1}`}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {error && (
              <View className="bg-red-100 dark:bg-red-900 p-3 rounded-lg mb-4">
                <Text className="text-red-700 dark:text-red-200">{error}</Text>
              </View>
            )}

            <View className="bg-yellow-100 dark:bg-yellow-900 p-5 rounded-lg mb-8">
              <Text className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                Important
              </Text>
              <Text className="text-yellow-800 dark:text-yellow-200">
                • Never share your recovery phrase with anyone{'\n'}
                • Make sure you're not on a public or insecure network{'\n'}
                • Index will never ask for your recovery phrase
              </Text>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity 
          className="bg-blue-600 py-4 rounded-xl items-center mb-6 mx-2"
          onPress={handleImport}
          disabled={isValidating}
        >
          {isValidating ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white font-semibold text-lg">Import Wallet</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </ThemedView>
  );
}
