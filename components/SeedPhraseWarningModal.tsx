import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Modal, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { Shield, Key, AlertTriangle, Copy, CheckCircle, X } from 'lucide-react-native';

interface SeedPhraseWarningModalProps {
  visible: boolean;
  onContinue: () => void;
  mode?: 'warning' | 'reveal';
  seedPhrase?: string;
}

export default function SeedPhraseWarningModal({ visible, onContinue, mode = 'warning', seedPhrase }: SeedPhraseWarningModalProps) {
  const { colorScheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);

  const handleCopy = async () => {
    if (seedPhrase) {
      try {
        await Clipboard.setStringAsync(seedPhrase);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  const handleClose = () => {
    setShowSeedPhrase(false);
    onContinue();
  };

  const words = seedPhrase ? seedPhrase.split(' ') : [];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        if (mode === 'reveal' && showSeedPhrase) {
          setShowSeedPhrase(false);
        }
      }}
    >
      <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black/50' : 'bg-black/30'}`}>
        <TouchableOpacity 
          className="flex-1 justify-center items-center px-6"
          activeOpacity={1}
          onPress={() => {
            if (mode === 'reveal' && !showSeedPhrase) {
              handleClose();
            }
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            className={`w-full max-w-sm rounded-3xl ${colorScheme === 'dark' ? 'bg-gray-800' : 'bg-white'} relative`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
              shadowRadius: 8,
              elevation: 4,
              maxHeight: '90%',
            }}
          >
            {/* Close button for reveal warning */}
            {mode === 'reveal' && !showSeedPhrase && (
              <TouchableOpacity
                onPress={handleClose}
                className="absolute top-4 right-4 z-10 p-2"
              >
                <X size={24} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            )}
            
            <View className="p-8">
            <View className={`w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 ${
              mode === 'reveal' && !showSeedPhrase
                ? colorScheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
                : mode === 'reveal' && showSeedPhrase
                ? colorScheme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
                : colorScheme === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-100'
            }`}>
              {mode === 'reveal' && !showSeedPhrase ? (
                <AlertTriangle size={40} color={colorScheme === 'dark' ? '#EF4444' : '#DC2626'} />
              ) : mode === 'reveal' && showSeedPhrase ? (
                <Key size={40} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
              ) : (
                <Shield size={40} color={colorScheme === 'dark' ? '#FCD34D' : '#F59E0B'} />
              )}
            </View>
            
            <Text className={`text-center text-2xl font-bold mb-6 ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {mode === 'reveal' && !showSeedPhrase ? 'Are you sure you want to reveal?' : mode === 'reveal' && showSeedPhrase ? 'Your Recovery Phrase' : 'Secure Your Wallet'}
            </Text>
            
            {mode === 'reveal' && showSeedPhrase && seedPhrase ? (
              <View className="mb-6">
                <Text className={`text-center text-sm mb-4 ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Keep this safe and never share it with anyone.
                </Text>
                
                <ScrollView style={{ height: 180 }} showsVerticalScrollIndicator={false} className="mb-4">
                  <View className="flex-row flex-wrap justify-between">
                    {words.map((word, index) => (
                      <View 
                        key={index} 
                        className="w-[30%] bg-gray-100 dark:bg-gray-700 rounded-xl p-3 mb-3"
                      >
                        <Text className="text-gray-500 dark:text-gray-400 text-xs absolute top-1 left-2">
                          {(index + 1).toString().padStart(2, '0')}
                        </Text>
                        <Text className="text-gray-900 dark:text-white text-base font-medium text-center mt-3">
                          {word}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                <TouchableOpacity
                  onPress={handleCopy}
                  className="flex-row items-center justify-center gap-2"
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
              </View>
            ) : (
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
            )}
            
            <TouchableOpacity 
              className={`py-4 px-8 rounded-2xl items-center ${
                colorScheme === 'dark' ? 'bg-yellow-600' : 'bg-yellow-500'
              }`}
              onPress={() => {
                if (mode === 'reveal' && !showSeedPhrase) {
                  setShowSeedPhrase(true);
                } else {
                  handleClose();
                }
              }}
              style={{
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Text className="text-white font-semibold text-lg">
                {mode === 'reveal' && !showSeedPhrase ? 'Reveal' : mode === 'reveal' && showSeedPhrase ? 'Close' : 'I Understand'}
              </Text>
            </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}