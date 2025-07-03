import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedView } from '@/components/core/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Copy, CheckCircle, ArrowRight } from 'lucide-react-native';
import SeedPhraseWarningModal from '@/components/modals/SeedPhraseWarningModal';

export default function CreateWalletScreen() {
  const { setOnboardingStep, generateSeedPhrase, setSeedPhraseForOnboarding } = useAuth();
  const { colorScheme } = useTheme();
  const [seedPhrase, setSeedPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    const phrase = generateSeedPhrase();
    setSeedPhrase(phrase);
    setSeedPhraseForOnboarding(phrase);
  }, []);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(seedPhrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const words = seedPhrase ? seedPhrase.split(' ') : [];

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-6">
          <TouchableOpacity onPress={() => setOnboardingStep('user-type')} className="mb-6">
            <ArrowLeft size={32} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <Text className="text-5xl font-bold text-black dark:text-white leading-tight mb-8">
            This is your{'\n'}password:
          </Text>
          
          {seedPhrase ? (
            <>
              <View className="flex-row flex-wrap justify-between mb-8">
                {words.map((word, index) => (
                  <View 
                    key={index} 
                    className="w-[30%] bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4"
                  >
                    <Text className="text-gray-500 dark:text-gray-400 text-xs absolute top-2 left-2">
                      {(index + 1).toString().padStart(2, '0')}
                    </Text>
                    <Text className="text-gray-900 dark:text-white text-lg font-medium text-center mt-2">
                      {word}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleCopy}
                className="flex-row items-center justify-center gap-2 mb-8"
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} color="#10B981" />
                    <Text className="text-sm font-medium text-[#10B981]">
                      Copied!
                    </Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#4B5563'} />
                    <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Copy Phrase
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-900 dark:text-white text-lg">Generating your seed phrase...</Text>
            </View>
          )}
        </ScrollView>

        <View className="absolute bottom-12 right-6">
          <TouchableOpacity
            onPress={() => setShowWarningModal(true)}
            className="bg-yellow-400 w-16 h-16 rounded-full items-center justify-center"
          >
            <ArrowRight size={32} color="#000000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      <SeedPhraseWarningModal
        visible={showWarningModal}
        onContinue={() => {
          setShowWarningModal(false);
          setOnboardingStep('verify-seed');
        }}
      />
    </ThemedView>
  );
}
