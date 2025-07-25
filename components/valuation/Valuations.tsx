import React from 'react';
import { View, Text, Image } from 'react-native';
import { ThemedView } from '@/components/core/ThemedView';

// Token type definition
interface Token {
  name: string;
  symbol: string;
  amount: string;
  value: number;
  change: number;
  iconUrl?: string;
}

interface ValuationsProps {
  totalValue: number;
  tokens: Token[];
}

export function Valuations({
  totalValue,
  tokens,
}: ValuationsProps) {
  return (
    <ThemedView
      className="flex-1 p-4 rounded-2xl pt-16 bg-white dark:bg-black"
    >
      {/* Header section */}
      <ValuationsHeader />

      {/* Total value display */}

      {/* Token list */}
      <TokenList tokens={tokens} />
    </ThemedView>
  );
}

function ValuationsHeader() {
  return (
    <View className="flex-row justify-center items-center mb-4">
      <Text className="text-xl font-semibold text-black dark:text-white">Set Valuations</Text>
    </View>
  );
}

function TotalValueDisplay({ totalValue }: { totalValue: number }) {
  return (
    <View className="items-center my-6">
      <Text className="text-7xl font-bold text-black dark:text-white">
        {Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(totalValue)}
      </Text>
    </View>
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
              <Text className="text-base font-bold text-black dark:text-white">{token.symbol.charAt(0)}</Text>
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
        <Text className={`text-sm ${token.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {token.change >= 0 ? '+' : ''}{token.change.toFixed(2)}%
        </Text>
      </View>
    </View>
  );
}
