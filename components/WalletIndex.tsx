import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, Linking, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedView } from './ThemedView';
import { Plus, ArrowUpRight, Copy, ChevronDown, Coins, Store, ArrowRight, Wallet, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { StripeAPI } from '@/services/stripe';

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
  onSendPress?: () => void;
  onCopyPress?: () => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function WalletIndex({
  totalValue,
  tokens,
  onBuyPress,
  onSwapPress,
  onSendPress,
  onCopyPress,
  isRefreshing = false,
  onRefresh,
}: WalletIndexProps) {
  const { colorScheme } = useTheme();
  const [showLoadWalletModal, setShowLoadWalletModal] = useState(false);
  return (
    <ThemedView
      className="flex-1 p-4 rounded-2xl pt-16 bg-white dark:bg-black"
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Top section with wallet name and dropdown */}
        <WalletHeader />

        {/* Total value display */}
        <TotalValueDisplay totalValue={totalValue} />

        {/* Action buttons */}
        <ActionButtonRow
          onBuyPress={onBuyPress}
          onSwapPress={onSwapPress}
          onSendPress={onSendPress}
          onCopyPress={onCopyPress}
        />

        {/* Token list */}
        <TokenList tokens={tokens} />
        
        {/* Load Wallet Section */}
        <LoadWalletSection onPress={() => setShowLoadWalletModal(true)} />
        
        {/* Partnered Vendors Section */}
        <PartneredVendorsSection />
        
        {/* Add some bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
      
      {/* Load Wallet Modal */}
      <LoadWalletModal 
        visible={showLoadWalletModal} 
        onClose={() => setShowLoadWalletModal(false)} 
      />
    </ThemedView>
  );
}

function WalletHeader() {
  const { userName, walletAddress } = useAuth(); // Get user from global state
  
  const displayName = userName || 'Wallet';
  
  useEffect(() => {
    console.log('HEADER - Wallet address changed to:', walletAddress);
  }, [walletAddress]);
  
  return (
    <View className="flex flex-row justify-center items-center mb-4">
      <View className="w-8 h-8 rounded-full bg-green-300 mr-4" />
      <View className="flex flex-col items-center">
        <Text className="text-black dark:text-white text-base font-semibold">{displayName}</Text>
        <Text className="text-black dark:text-white text-base font-semibold text-ellipsis">
          {walletAddress ? 
            `${walletAddress.substring(0, 3)}...${walletAddress.substring(walletAddress.length - 3)}` : 
            'No wallet address'}
        </Text>
      </View>
    </View>
  );
}

function TotalValueDisplay({ totalValue }: { totalValue: number }) {
  return (
    <View className="items-center my-6">
      <Text className="text-6xl font-bold text-black dark:text-white">
        {Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
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
    >
      <View 
        className="flex-row items-center justify-between p-4 rounded-xl"
        style={{ 
          backgroundColor: colorScheme === 'dark' ? '#323E4F' : '#EBF2FF',
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? '#4F83CC' : '#C7D9F2',
        }}
      >
        <View className="flex-row items-center">
          <View 
            className="w-10 h-10 rounded-full mr-3 justify-center items-center"
            style={{ backgroundColor: '#4F83CC' }}
          >
            <Wallet size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text 
              className="font-bold text-base"
              style={{ color: colorScheme === 'dark' ? '#4F83CC' : '#4F83CC' }}
            >
              Load Wallet
            </Text>
            <Text 
              className="text-sm"
              style={{ color: colorScheme === 'dark' ? '#8EAEE0' : '#4F83CC' }}
            >
              Add funds to your wallet
            </Text>
          </View>
        </View>
        <ArrowRight size={20} color={colorScheme === 'dark' ? '#4F83CC' : '#4F83CC'} />
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
      // TODO: abstract this to a env variable: 
      const stripeUrl = `https://buy.stripe.com/test_6oE6pt3uO3gH1tS5kk?client_reference_id=${walletAddress}`;
      
      // Open the Stripe checkout page in browser
      await Linking.openURL(stripeUrl);
      
      // Close modal after opening the link
      onClose();
    } catch (error) {
      console.error('Error opening Stripe payment link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupportCauses = () => {
    // Navigate to vendors/causes page
    router.push('/(tabs)/vendors');
    onClose();
  };
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <BlurView
        intensity={20}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View 
          className="w-full rounded-3xl p-6 shadow-2xl"
          style={{ 
            backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            maxWidth: 400,
          }}
        >
          <View className="flex-row justify-between items-center mb-6">
            <Text 
              className="text-2xl font-bold"
              style={{ color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }}
            >
              Load Your Wallet
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          <View className="mb-6">
            <Text 
              className="text-base mb-6 text-center"
              style={{ color: colorScheme === 'dark' ? '#D1D5DB' : '#4B5563' }}
            >
              Choose how you'd like to add value to your wallet
            </Text>
            
            {/* Add USD with Stripe */}
            <TouchableOpacity 
              className="py-4 px-6 rounded-xl mb-4 flex-row items-center"
              style={{ 
                backgroundColor: '#4F83CC',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={handleAddUSD}
              disabled={isLoading}
            >
              <Wallet size={24} color="#FFFFFF" style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">Add USD</Text>
                <Text className="text-blue-100 text-sm">Load money with Stripe</Text>
              </View>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Support Other Causes */}
            <TouchableOpacity 
              className="py-4 px-6 rounded-xl mb-4 flex-row items-center"
              style={{ 
                backgroundColor: '#FF8C42',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={handleSupportCauses}
            >
              <Store size={24} color="#FFFFFF" style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">Support Other Causes</Text>
                <Text className="text-orange-100 text-sm">Browse partnered vendors</Text>
              </View>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onClose} className="mt-4">
              <Text 
                className="text-center text-base"
                style={{ color: colorScheme === 'dark' ? '#8EAEE0' : '#4F83CC' }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
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
    >
      <View 
        className="flex-row items-center justify-between p-4 rounded-xl"
        style={{ 
          backgroundColor: colorScheme === 'dark' ? '#402E32' : '#FFF0E6',
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? '#FF8C42' : '#FFD8C2',
        }}
      >
        <View className="flex-row items-center">
          <View 
            className="w-10 h-10 rounded-full mr-3 justify-center items-center"
            style={{ backgroundColor: '#FF8C42' }}
          >
            <Store size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text 
              className="font-bold text-base"
              style={{ color: colorScheme === 'dark' ? '#FF8C42' : '#FF8C42' }}
            >
              Partnered Vendors
            </Text>
            <Text 
              className="text-sm"
              style={{ color: colorScheme === 'dark' ? '#FFB38A' : '#FF8C42' }}
            >
              Explore businesses that accept your tokens
            </Text>
          </View>
        </View>
        <ArrowRight size={20} color={colorScheme === 'dark' ? '#FF8C42' : '#FF8C42'} />
      </View>
    </TouchableOpacity>
  );
}

function ActionButtonRow({
  onBuyPress,
  onSwapPress,
  onSendPress,
  onCopyPress,
}: {
  onBuyPress?: () => void;
  onSwapPress?: () => void;
  onSendPress?: () => void;
  onCopyPress?: () => void;
}) {
  return (
    <View className="flex-row px-24 justify-center gap-4 mb-8">
      <ActionButton icon={<Plus size={18} className="text-black dark:text-white" />} onPress={onBuyPress} />
      <ActionButton icon={<ArrowUpRight size={18} className="text-black dark:text-white" />} onPress={onSendPress} />
      <ActionButton icon={<Copy size={18} className="text-black dark:text-white" />} onPress={onCopyPress} />
    </View>
  );
}

function ActionButton({
  icon,
  onPress,
}: {
  icon: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity className="items-center" onPress={onPress}>
      <View className="w-12 h-12 rounded-full bg-amber-500 justify-center items-center mb-2">
        {icon}
      </View>
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
            maximumFractionDigits: 2,
          }).format(token.value)}
        </Text>
      </View>
    </View>
  );
}
