import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, Linking } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, Store, ArrowRight, X } from 'lucide-react-native';

interface LoadWalletModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LoadWalletModal({ visible, onClose }: LoadWalletModalProps) {
  const { colorScheme } = useTheme();
  const { walletAddress } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddUSD = async () => {
    try {
      setIsLoading(true);
      
      // Direct Stripe checkout link with client reference ID
      const stripeBaseUrl = process.env.EXPO_PUBLIC_STRIPE_USD_ID || 'https://buy.stripe.com/test_6oE6pt3uO3gH1tS5kk';
      const stripeUrl = `${stripeBaseUrl}?client_reference_id=${walletAddress}`;
      
      // Open the Stripe checkout page in browser
      await Linking.openURL(stripeUrl);
      
      // Close modal after opening the link
      onClose();
    } catch (error) {
      // Error opening Stripe payment link
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupportCauses = async () => {
    // Open Index Wallets website in browser
    await Linking.openURL('https://app.indexwallets.org');
    onClose();
  };
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black/50' : 'bg-black/30'}`}>
        <TouchableOpacity 
          className="flex-1 justify-center items-center px-6"
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            className={`w-full max-w-sm p-8 rounded-3xl ${colorScheme === 'dark' ? 'bg-gray-800/95' : 'bg-white'}`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Close button */}
            <TouchableOpacity 
              className="absolute top-4 right-4 p-2"
              onPress={onClose}
            >
              <X size={24} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
            
            <View className={`w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 ${
              colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Text className="text-3xl">💵</Text>
            </View>
            
            <Text className={`text-center text-2xl font-bold mb-2 ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Load Your Wallet
            </Text>
            <Text className={`text-center text-base mb-8 ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose how you'd like to add value to your wallet
            </Text>
            
            {/* Add with USD - Opens explainer */}
            <TouchableOpacity 
              className="py-4 px-5 rounded-2xl mb-4 flex-row items-center"
              style={{ 
                backgroundColor: colorScheme === 'dark' ? '#3B82F6' : '#3B82F6',
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
              onPress={handleAddUSD}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View className="w-12 h-12 bg-white/20 rounded-xl justify-center items-center mr-3">
                <Wallet size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">Add with USD</Text>
                <Text className="text-blue-100 text-sm opacity-90">Buy USD Index tokens</Text>
              </View>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Support Other Causes */}
            <TouchableOpacity 
              className="py-4 px-5 rounded-2xl mb-4 flex-row items-center"
              style={{ 
                backgroundColor: colorScheme === 'dark' ? '#F59E0B' : '#F59E0B',
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
              onPress={handleSupportCauses}
              activeOpacity={0.8}
            >
              <View className="w-12 h-12 bg-white/20 rounded-xl justify-center items-center mr-3">
                <Store size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">Support Other Causes</Text>
                <Text className="text-amber-100 text-sm opacity-90">Browse partnered causes</Text>
              </View>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onClose} className="mt-2">
              <Text className={`text-center text-base ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}