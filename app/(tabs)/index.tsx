import { StyleSheet, View, Alert } from 'react-native';
import { WalletIndex } from '@/components/WalletIndex';
import { ThemedView } from '@/components/ThemedView';

// Mock data for the wallet
const mockTokens = [
  {
    name: 'USD ',
    symbol: 'USD',
    amount: '10.93',
    value: 10.93,
    change: 0.14,
    iconUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  {
    name: 'Wikipedia',
    symbol: 'WIKI',
    amount: '30',
    value: 40.55,
    change: 2.12,
    iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  },
  {
    name: 'Library',
    symbol: 'LIB',
    amount: '5',
    value: 8.37,
    change: 0.72,
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    name: 'River Cleanup',
    symbol: 'RIVER',
    amount: '0.79',
    value: 1.09,
    change: 1.20,
    iconUrl: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
  },
];

export default function HomeScreen() {
  // Calculate total value from all tokens
  const totalValue = mockTokens.reduce((sum, token) => sum + token.value, 0);

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

  return (
    <ThemedView style={styles.container}>
      <WalletIndex 
        totalValue={totalValue}
        tokens={mockTokens}
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
});
