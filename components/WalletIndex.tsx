import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, Linking, RefreshControl, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedView } from './ThemedView';
import { Plus, Copy, Store, ArrowRight, Wallet, X, Clock, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { StripeAPI } from '@/services/stripe';
import * as Clipboard from 'expo-clipboard';

// Token type definition
interface Token {
  name: string;
  symbol: string;
  amount: string;
  value: number;
  iconUrl?: string;
}

interface WalletIndexProps {
  totalValue: number;
  tokens: Token[];
  onBuyPress?: () => void;
  onSwapPress?: () => void;
  onCopyPress?: () => void;
  showCopyCheckmark?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function WalletIndex({
  totalValue,
  tokens,
  onBuyPress,
  onSwapPress,
  onCopyPress,
  showCopyCheckmark = false,
  isRefreshing = false,
  onRefresh,
}: WalletIndexProps) {
  const { colorScheme } = useTheme();
  const [showLoadWalletModal, setShowLoadWalletModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [autoCopyOnOpen, setAutoCopyOnOpen] = useState(false);
  
  // Override onBuyPress to show Load Wallet modal
  const handleAddPress = () => {
    setShowLoadWalletModal(true);
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }}>
      <ThemedView
        className="flex-1 p-4 bg-white dark:bg-black"
      >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#E5E7EB']}
            tintColor="#E5E7EB"
          />
        }
      >
        {/* Top section with wallet name and dropdown */}
        <WalletHeader 
          showAddressModal={showAddressModal}
          setShowAddressModal={setShowAddressModal}
          autoCopyOnOpen={autoCopyOnOpen}
          setAutoCopyOnOpen={setAutoCopyOnOpen}
        />

        {/* Total value display */}
        <TotalValueDisplay totalValue={totalValue} />

        {/* Action buttons */}
        <ActionButtonRow
          onBuyPress={handleAddPress}
          onSwapPress={onSwapPress}
          onHistoryPress={() => router.push('/history')}
          onCopyPress={() => {
            setAutoCopyOnOpen(true);
            setShowAddressModal(true);
          }}
          showCopyCheckmark={showCopyCheckmark}
        />

        {/* Token list */}
        <TokenList tokens={tokens} />
        
        {/* Load Wallet Section */}
        <LoadWalletSection onPress={() => setShowLoadWalletModal(true)} />
        
        {/* Partnered Vendors Section */}
        <PartneredVendorsSection />
        
        
        {/* Add some bottom padding to account for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Load Wallet Modal */}
      <LoadWalletModal 
        visible={showLoadWalletModal} 
        onClose={() => setShowLoadWalletModal(false)} 
      />
      </ThemedView>
    </SafeAreaView>
  );
}

function WalletHeader({ 
  showAddressModal, 
  setShowAddressModal, 
  autoCopyOnOpen,
  setAutoCopyOnOpen 
}: { 
  showAddressModal: boolean;
  setShowAddressModal: (show: boolean) => void;
  autoCopyOnOpen: boolean;
  setAutoCopyOnOpen: (auto: boolean) => void;
}) {
  const { userName, walletAddress } = useAuth(); // Get user from global state
  const [copied, setCopied] = useState(false);
  const { colorScheme } = useTheme();
  
  const displayName = userName || 'Wallet';
  
  useEffect(() => {
    // console.log('HEADER - Wallet address changed to:', walletAddress);
  }, [walletAddress]);
  
  const handleCopyAddress = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Auto-copy when modal opens with autoCopyOnOpen flag
  useEffect(() => {
    if (showAddressModal && autoCopyOnOpen && walletAddress) {
      handleCopyAddress();
      setAutoCopyOnOpen(false); // Reset the flag
    }
  }, [showAddressModal, autoCopyOnOpen, walletAddress]);
  
  return (
    <>
      <View className="flex flex-row justify-center items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-green-300 mr-4" />
        <TouchableOpacity onPress={() => setShowAddressModal(true)}>
          <View className="flex flex-col items-center">
            <Text className="text-black dark:text-white text-base font-semibold">{displayName}</Text>
            <Text className="text-black dark:text-white text-base font-semibold text-ellipsis">
              {walletAddress ? 
                `${walletAddress.substring(0, 3)}...${walletAddress.substring(walletAddress.length - 3)}` : 
                'No wallet address'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Address Modal */}
      <Modal
        visible={showAddressModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black/50' : 'bg-black/30'}`}>
          <TouchableOpacity 
            className="flex-1 justify-center items-center px-6"
            activeOpacity={1}
            onPress={() => setShowAddressModal(false)}
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
                onPress={() => setShowAddressModal(false)}
              >
                <X size={24} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
              
              <View className={`w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 ${
                colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Text className="text-3xl">🔐</Text>
              </View>
              
              <Text className={`text-center text-2xl font-bold mb-2 ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Wallet Address
              </Text>
              <Text className={`text-center text-base mb-6 ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Your unique wallet identifier
              </Text>
              
              {/* Address display */}
              <View className={`p-4 rounded-2xl mb-6 ${colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Text 
                  className={`text-sm font-mono text-center ${colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                  style={{ lineHeight: 20 }}
                >
                  {walletAddress || 'No wallet address'}
                </Text>
              </View>
              
              {/* Copy button */}
              <TouchableOpacity 
                className={`py-4 px-8 rounded-2xl items-center flex-row justify-center ${
                  copied
                    ? (colorScheme === 'dark' ? 'bg-green-600' : 'bg-green-500')
                    : (colorScheme === 'dark' ? 'bg-blue-600' : 'bg-blue-500')
                }`}
                onPress={handleCopyAddress}
                style={{
                  shadowColor: copied ? '#10B981' : '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                {copied ? (
                  <>
                    <Check size={20} color="#FFFFFF" />
                    <Text className="text-white font-semibold text-lg ml-2">Copied!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={20} color="#FFFFFF" />
                    <Text className="text-white font-semibold text-lg ml-2">Copy Address</Text>
                  </>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function TotalValueDisplay({ totalValue }: { totalValue: number }) {
  return (
    <View className="items-center my-6">
      <Text className="text-6xl font-bold text-black dark:text-white">
        {Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalValue)}
      </Text>
    </View>
  );
}

function LoadWalletSection({ onPress }: { onPress: () => void }) {
  const { colorScheme } = useTheme();

  return (
    <TouchableOpacity 
      className="mt-4"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View 
        className="flex-row items-center justify-between p-4 rounded-2xl"
        style={{ 
          backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View className="flex-row items-center">
          <View 
            className="w-12 h-12 rounded-xl mr-3 justify-center items-center"
            style={{ backgroundColor: colorScheme === 'dark' ? '#3B82F6' : '#DBEAFE' }}
          >
            <Wallet size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#3B82F6'} />
          </View>
          <View>
            <Text 
              className="font-semibold text-base"
              style={{ color: colorScheme === 'dark' ? '#F3F4F6' : '#111827' }}
            >
              Load Wallet
            </Text>
            <Text 
              className="text-sm"
              style={{ color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }}
            >
              Add funds to your wallet
            </Text>
          </View>
        </View>
        <ArrowRight size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      </View>
    </TouchableOpacity>
  );
}

function LoadWalletModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
      // console.error('Error opening Stripe payment link:', error);
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
            
            {/* Add USD with Stripe */}
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
                <Text className="text-white font-semibold text-base">Add USD</Text>
                <Text className="text-blue-100 text-sm opacity-90">Load money with Stripe</Text>
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

function PartneredVendorsSection() {
  const { colorScheme } = useTheme();
  const navigateToVendors = () => {
    router.push('/(tabs)/vendors');
  };

  return (
    <TouchableOpacity 
      className="mt-4"
      onPress={navigateToVendors}
      activeOpacity={0.8}
    >
      <View 
        className="flex-row items-center justify-between p-4 rounded-2xl"
        style={{ 
          backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View className="flex-row items-center">
          <View 
            className="w-12 h-12 rounded-xl mr-3 justify-center items-center"
            style={{ backgroundColor: colorScheme === 'dark' ? '#F59E0B' : '#FEF3C7' }}
          >
            <Store size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#F59E0B'} />
          </View>
          <View>
            <Text 
              className="font-semibold text-base"
              style={{ color: colorScheme === 'dark' ? '#F3F4F6' : '#111827' }}
            >
              Partnered Vendors
            </Text>
            <Text 
              className="text-sm"
              style={{ color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }}
            >
              Explore businesses that accept your tokens
            </Text>
          </View>
        </View>
        <ArrowRight size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      </View>
    </TouchableOpacity>
  );
}

function ActionButtonRow({
  onBuyPress,
  onSwapPress,
  onHistoryPress,
  onCopyPress,
  showCopyCheckmark,
}: {
  onBuyPress?: () => void;
  onSwapPress?: () => void;
  onHistoryPress?: () => void;
  onCopyPress?: () => void;
  showCopyCheckmark?: boolean;
}) {
  const { colorScheme } = useTheme();
  return (
    <View className="flex-row justify-center gap-4 px-4 mb-6">
      <ActionButton 
        icon={<Plus size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#374151'} />} 
        label="Add"
        onPress={onBuyPress} 
      />
      <ActionButton 
        icon={<Clock size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#374151'} />} 
        label="History"
        onPress={onHistoryPress} 
      />
      <ActionButton 
        icon={showCopyCheckmark ? 
          <Check size={24} color={colorScheme === 'dark' ? '#10B981' : '#059669'} /> : 
          <Copy size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#374151'} />
        } 
        label={showCopyCheckmark ? "Copied" : "Copy"}
        onPress={onCopyPress} 
      />
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  const { colorScheme } = useTheme();
  return (
    <TouchableOpacity 
      className="items-center" 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View 
        className="w-16 h-16 rounded-2xl justify-center items-center mb-2"
        style={{
          backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#F3F4F6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {icon}
      </View>
      <Text 
        className="text-sm font-medium"
        style={{ color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function TokenList({ tokens }: { tokens: Token[] }) {
  const { colorScheme } = useTheme();
  
  return (
    <View className="flex-1 mt-4">
      {/* Header with cause count */}
      <View className="flex-row items-center mb-2">
        <Text 
          className="text-xl font-bold" 
          style={{ color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }}
        >
          Causes {tokens.length > 0 && <Text className="text-gray-500">{tokens.length}</Text>}
        </Text>
      </View>
      
      {/* Causes list */}
      {tokens.map((token, index) => (
        <TokenRow key={index} token={token} />
      ))}
    </View>
  );
}

function TokenRow({ token }: { token: Token }) {
  const { colorScheme } = useTheme();
  
  return (
    <View
      className="flex-row justify-between items-center py-4 border-b border-black/5 dark:border-white/10"
      key={token.symbol}
    >
      <View className="flex-row items-center">
        {/* Token Logo */}
        <View className="mr-4">
          {token.iconUrl ? (
            <Image 
              source={{ uri: token.iconUrl }} 
              className="w-12 h-12 rounded-full"
              style={{
                borderWidth: 1,
                borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }}
            />
          ) : (
            <View 
              className="w-12 h-12 rounded-full justify-center items-center"
              style={{ 
                backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
                borderWidth: 1,
                borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }}
            >
              <Text 
                className="text-lg font-bold"
                style={{ color: colorScheme === 'dark' ? '#F9FAFB' : '#1F2937' }}
              >
                {token.symbol.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Token Info */}
        <View className="justify-center">
          <Text className="text-lg font-semibold text-black dark:text-white">{token.name}</Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">{token.amount} {token.symbol}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-lg font-semibold text-black dark:text-white">
          {Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(token.value)}
        </Text>
      </View>
    </View>
  );
}
