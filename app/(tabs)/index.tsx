import { StyleSheet, Alert, AppState } from 'react-native';
import { WalletIndex } from '@/components/wallet/WalletIndex';
import { ThemedView } from '@/components/core/ThemedView';
import { useBalance } from '@/contexts/BalanceContext';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const { balances, totalValueUSD, refreshBalances } = useBalance();
  const [refreshing, setRefreshing] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);

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
