import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Modal } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Copy, CheckCircle, ArrowRight, Shield, Key, AlertTriangle, X } from 'lucide-react-native';

export default function CreateWalletScreen() {
  const { setOnboardingStep, userType, generateSeedPhrase, setSeedPhraseForOnboarding } = useAuth();
  const { colorScheme } = useTheme();
  const [seedPhrase, setSeedPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(true);

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
          <TouchableOpacity onPress={() => setOnboardingStep('user-type')} className="mb-16">
            <ArrowLeft size={32} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>

          <Text className="text-5xl font-bold text-black dark:text-white leading-tight mb-4">
            This is your{'\n'}password:
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
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
            onPress={() => setOnboardingStep('verify-seed')}
            className="bg-yellow-400 w-16 h-16 rounded-full items-center justify-center"
          >
            <ArrowRight size={32} color="#000000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      {/* Security Information Modal */}
      <Modal
        visible={showSecurityModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {}}
      >
        <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black/50' : 'bg-black/30'}`}>
          <TouchableOpacity 
            className="flex-1 justify-center items-center px-6"
            activeOpacity={1}
          >
            <View
              className={`w-full max-w-sm p-8 rounded-3xl ${colorScheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {/* Modal Header */}
              <View className={`w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 ${
                colorScheme === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-100'
              }`}>
                <Shield size={40} color={colorScheme === 'dark' ? '#FCD34D' : '#F59E0B'} />
              </View>
              
              <Text className={`text-center text-2xl font-bold mb-6 ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Secure Your Wallet
              </Text>
              
              {/* Security tips with icons */}
              <View className="mb-6">
                <View className="flex-row items-start mb-4">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    colorScheme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
                  }`}>
                    <Key size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-semibold mb-1 ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Master Key to Your Wallet
                    </Text>
                    <Text className={`text-sm leading-relaxed ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Your seed phrase is the only way to recover your wallet if you lose your device.
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start mb-4">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    colorScheme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
                  }`}>
                    <Shield size={20} color={colorScheme === 'dark' ? '#10B981' : '#059669'} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-semibold mb-1 ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Write It Down Safely
                    </Text>
                    <Text className={`text-sm leading-relaxed ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Write it on paper and store it somewhere secure. Never save it digitally.
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    colorScheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
                  }`}>
                    <AlertTriangle size={20} color={colorScheme === 'dark' ? '#EF4444' : '#DC2626'} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-semibold mb-1 ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Never Share With Anyone
                    </Text>
                    <Text className={`text-sm leading-relaxed ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Anyone with your seed phrase can access all your funds permanently.
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Continue button */}
              <TouchableOpacity 
                className={`py-4 px-8 rounded-2xl items-center ${
                  colorScheme === 'dark' ? 'bg-yellow-600' : 'bg-yellow-500'
                }`}
                onPress={() => setShowSecurityModal(false)}
                style={{
                  shadowColor: '#F59E0B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text className="text-white font-semibold text-lg">I Understand</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </ThemedView>
  );
}
