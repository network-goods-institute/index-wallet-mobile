import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

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
  return (
    <ThemedView
      className="flex-1 bg-[#000000] p-4 rounded-2xl pt-16"
      style={{ backgroundColor: '#000000' }}
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
    </ThemedView>
  );
}

function WalletHeader() {
  return (
    <View className="flex flex-row justify-center items-center mb-4">
      <View className="w-8 h-8 rounded-full bg-green-300 mr-4" />
      <View className="flex flex-row items-center">
        <Text className="text-base font-semibold text-white">Wallet 1</Text>
        <Text className="text-xs text-white ml-1"></Text>
      </View>
    </View>
  );
}

function TotalValueDisplay({ totalValue }: { totalValue: number }) {
  return (
    <View className="items-center my-6">
      <Text className="text-8xl font-bold text-white">
        {Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(totalValue)}
      </Text>
    </View>
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
    <View className="flex-row px-24 justify-center gap-4 space-between mb-8">
      <ActionButton icon="+" onPress={onBuyPress} />
      <ActionButton icon="↗" onPress={onSendPress} />
      <ActionButton icon="⎘" onPress={onCopyPress} />
    </View>
  );
}

function ActionButton({
  icon,
  onPress,
}: {
  icon: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity className="items-center" onPress={onPress}>
      <View className="w-12 h-12 rounded-full bg-[#FFA500] justify-center items-center mb-2">
        <Text className="text-2xl text-black">{icon}</Text>
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
      className="flex-row justify-between items-center py-3 border-b border-white/10"
      key={token.symbol}
    >
      <View className="flex-row items-center">
        <View className="mr-3">
          {token.iconUrl ? (
            <Image source={{ uri: token.iconUrl }} className="w-9 h-9 rounded-full" />
          ) : (
            <View className="w-9 h-9 rounded-full bg-[#4A4A4A] justify-center items-center">
              <Text className="text-base font-bold text-white">{token.symbol.charAt(0)}</Text>
            </View>
          )}
        </View>
        <View className="justify-center">
          <Text className="text-base font-medium text-white mb-1">{token.name}</Text>
          <Text className="text-sm text-[#AAAAAA]">{token.amount} {token.symbol}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-base font-medium text-white mb-1">
          {Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(token.value)}
        </Text>
      </View>
    </View>
  );
}
