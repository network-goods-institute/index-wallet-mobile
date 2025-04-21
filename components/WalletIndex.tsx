import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedView } from './ThemedView';
import { Plus, ArrowUpRight, Copy, ChevronDown, Coins, Store, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

// Token type definition
interface Token {
  name: string;
  symbol: string;
  amount: string;
  value: number;
  change: number;
  iconUrl?: string;
}

interface WalletIndexProps {
  totalValue: number;
  tokens: Token[];
  onBuyPress?: () => void;
  onSwapPress?: () => void;
  onSendPress?: () => void;
  onCopyPress?: () => void;
}

export function WalletIndex({
  totalValue,
  tokens,
  onBuyPress,
  onSwapPress,
  onSendPress,
  onCopyPress,
}: WalletIndexProps) {
  const { colorScheme } = useTheme();
  return (
    <ThemedView
      className="flex-1 p-4 rounded-2xl pt-16 bg-white dark:bg-black"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
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
        
        {/* Partnered Vendors Section */}
        <PartneredVendorsSection />
        
        {/* Add some bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </ThemedView>
  );
}

function WalletHeader() {
  const { userName, walletAddress } = useAuth(); // Get user from global state
  
  // Display username from global state or fallback to 'Wallet'
  const displayName = userName || 'Wallet';
  
  return (
    <View className="flex flex-row justify-center items-center mb-4">
      <View className="w-8 h-8 rounded-full bg-green-300 mr-4" />
      <View className="flex flex-col items-center">
        <Text className="text-black dark:text-white text-base font-semibold">{displayName}</Text>
        <Text className="text-black dark:text-white text-base font-semibold text-ellipsis">
          {`${walletAddress?.substring(0, 3)}...${walletAddress?.substring(walletAddress?.length - 3)}`}
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

function PartneredVendorsSection() {
  const { colorScheme } = useTheme();
  const navigateToVendors = () => {
    router.push('/(tabs)/vendors');
  };

  return (
    <TouchableOpacity 
      className="mt-6 mb-4"
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
  return (
    <View className="flex-1">
      {tokens.map((token, index) => (
        <TokenRow key={index} token={token} />
      ))}
    </View>
  );
}

function TokenRow({ token }: { token: Token }) {
  return (
    <View
      className="flex-row justify-between items-center py-3 border-b border-black/10 dark:border-white/10"
      key={token.symbol}
    >
      <View className="flex-row items-center">
        <View className="mr-3">
          {token.iconUrl ? (
            <Image source={{ uri: token.iconUrl }} className="w-9 h-9 rounded-full" />
          ) : (
            <View className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 justify-center items-center">
              <Coins size={18} className="text-black dark:text-white" />
            </View>
          )}
        </View>
        <View className="justify-center">
          <Text className="text-base font-medium text-black dark:text-white mb-1">{token.name}</Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">{token.amount} {token.symbol}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-base font-medium text-black dark:text-white mb-1">
          {Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(token.value)}
        </Text>
        <Text
          className={`text-sm ${token.change >= 0 ? 'text-green-500' : 'text-red-500'}`}
        >
          {token.change >= 0 ? '+' : ''}
          {token.change.toFixed(2)}%
        </Text>
      </View>
    </View>
  );
}
