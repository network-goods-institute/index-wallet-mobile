import { StyleSheet, View, Alert, AppState, TouchableOpacity, Text } from 'react-native';
import { WalletIndex } from '@/components/WalletIndex';
import { ThemedView } from '@/components/ThemedView';
import { TokenBalance, useBalance } from '@/contexts/BalanceContext';
import { useEffect } from 'react';
import { sendMockTransaction } from '@/services/mockTransactionService';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { balances, totalValueUSD, isLoading, error, refreshBalances, lastUpdated } = useBalance();
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

  const handleSend = () => {
    Alert.alert('Send', 'Trigger Payment flow');
  };

  const handleCopy = () => {
    Alert.alert('Copy', 'Address copied to clipboard!');
  };

  // Handle mock transaction
  const handleMockTransaction = async () => {
    try {
      if (!keyPair || !keyPair.privateKey) {
        console.log('Private key not available in keyPair:', keyPair);
        Alert.alert('Error', 'Private key not available. Please make sure you are logged in.');
        return;
      }
      
      console.log('Using private key from keyPair:', keyPair.privateKey);
      await sendMockTransaction(keyPair.privateKey);
    } catch (error) {
      console.error('Error in mock transaction:', error);
      Alert.alert('Transaction Error', error instanceof Error ? error.message : 'Failed to process transaction');
    }
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
      {/* Mock Transaction Button */}
      <TouchableOpacity 
        style={styles.mockButton}
        onPress={handleMockTransaction}
      >
        <Text style={styles.mockButtonText}>Send Mock Transaction</Text>
      </TouchableOpacity>
      
      <WalletIndex 
        totalValue={totalValueUSD}
        tokens={transformedTokens}
        onBuyPress={handleBuy}
        onSwapPress={handleSwap}
        onSendPress={handleSend}
        onCopyPress={handleCopy}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mockButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#FF8C42',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 10,
  },
  mockButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
