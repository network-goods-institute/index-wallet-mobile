import { StyleSheet, View, Alert, AppState, TouchableOpacity, Text } from 'react-native';
import { WalletIndex } from '@/components/WalletIndex';
import { ThemedView } from '@/components/ThemedView';
import { TokenBalance, useBalance } from '@/contexts/BalanceContext';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as Clipboard from 'expo-clipboard';

export default function HomeScreen() {
  const { balances, totalValueUSD, isLoading, error, refreshBalances, lastUpdated } = useBalance();
  const [refreshing, setRefreshing] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const { keyPair } = useAuth();

  useEffect(() => {
    // Initial fetch
    refreshBalances();

    // Set up AppState listener for background/foreground transitions
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshBalances();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  // Action handlers
  const handleBuy = () => {
    Alert.alert('Buy', 'Trigger Stripe flow');
  }; 

  const handleSwap = () => {
    return;
  };

  const handleCopy = async () => {
    // This is now handled internally by WalletIndex
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalances();
    setRefreshing(false);
  };


  // Transform balances to the format expected by WalletIndex
  const transformedTokens = balances.map(token => ({
    name: token.tokenName,
    symbol: token.tokenSymbol,
    amount: token.amount.toString(),
    value: token.valueUSD,
    iconUrl: token.logoUrl,
  }));

  return (
    <ThemedView style={styles.container}>
      <WalletIndex 
        totalValue={totalValueUSD}
        tokens={transformedTokens}
        onBuyPress={handleBuy}
        onSwapPress={handleSwap}
        onCopyPress={handleCopy}
        showCopyCheckmark={showCheckmark}
        isRefreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80, // Space for floating tab bar
  },
});
