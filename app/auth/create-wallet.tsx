import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { Copy, CheckCircle, ArrowLeft } from 'lucide-react-native';

export default function CreateWalletScreen() {
  const { generateSeedPhrase, completeOnboarding, setOnboardingStep } = useAuth();
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [seedWords, setSeedWords] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate a seed phrase when the component mounts
  useEffect(() => {
    const phrase = generateSeedPhrase();
    setSeedPhrase(phrase);
    setSeedWords(phrase.split(' '));
  }, []);

  const handleCopy = () => {
    // In a real app, we would use Clipboard.setString(seedPhrase)
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleContinue = async () => {
    // In a real app, we would verify that the user has backed up their seed phrase
    Alert.alert(
      'Important',
      'Have you securely backed up your seed phrase? You will not be able to recover your wallet without it.',
      [
        {
          text: 'No, I need to back it up',
          style: 'cancel',
        },
        {
          text: 'Yes, I have backed it up',
          onPress: async () => {
            const success = await completeOnboarding(seedPhrase, false);
            // Navigation will be handled by the app layout based on auth status
          },
        },
      ]
    );
  };

  return (
    <ThemedView className="flex-1 m-4">
      <SafeAreaView className="flex-1 p-8">
      <View className="flex-row items-center mb-8">
        <TouchableOpacity onPress={() => setOnboardingStep('welcome')} className="mr-4">
          <ArrowLeft size={24} className="text-black dark:text-white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-black dark:text-white">Create Wallet</Text>
      </View>

      <ScrollView className="flex-1 mx-2">
        <View className="mb-8">
          <Text className="text-lg font-semibold text-black dark:text-white mb-2">
            Your Recovery Seed Phrase
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 mb-6">
            Write down these 12 words in order and keep them in a safe place. Anyone with this phrase can access your wallet.
          </Text>

          <View className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 mb-5">
            <View className="flex-row flex-wrap justify-between">
              {seedWords.map((word, index) => (
                <View key={index} className="w-[30%] p-2">
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">{index + 1}.</Text>
                  <Text className="text-black dark:text-white font-medium">{word}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            className="flex-row items-center justify-center py-3 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"
            onPress={handleCopy}
          >
            {copied ? (
              <>
                <CheckCircle size={18} className="text-green-500 mr-2" />
                <Text className="text-black dark:text-white font-medium">Copied!</Text>
              </>
            ) : (
              <>
                <Copy size={18} className="text-black dark:text-white mr-2" />
                <Text className="text-black dark:text-white font-medium">Copy to Clipboard</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="mb-8">
          <Text className="text-lg font-semibold text-black dark:text-white mb-2">
            Important
          </Text>
          <View className="bg-yellow-100 dark:bg-yellow-900 p-5 rounded-lg">
            <Text className="text-yellow-800 dark:text-yellow-200">
              • Never share your recovery phrase with anyone{'\n'}
              • Index will never ask for your recovery phrase{'\n'}
              • Store this phrase in a secure location{'\n'}
              • If you lose this phrase, you will lose access to your wallet
            </Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        className="bg-blue-600 py-4 rounded-xl items-center mb-6 mx-2"
        onPress={handleContinue}
      >
        <Text className="text-white font-semibold text-lg">I've Backed Up My Phrase</Text>
      </TouchableOpacity>
      </SafeAreaView>
    </ThemedView>
  );
}
