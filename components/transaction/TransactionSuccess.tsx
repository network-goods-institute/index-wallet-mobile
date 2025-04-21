import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';

interface TransactionSuccessProps {
  transaction: any; // Using 'any' to match the TransactionContext implementation
  onClose: () => void;
}

const TransactionSuccess: React.FC<TransactionSuccessProps> = ({ transaction, onClose }) => {
  const { colorScheme } = useTheme();
  
  // Format timestamp to readable date
  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp * 1000) 
      : new Date(timestamp);
    
    return date.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[
        styles.card,
        { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }
      ]}>
        {/* Success Message */}
        <ThemedText className="text-2xl font-bold text-center mb-4">
          Payment Successful!
        </ThemedText>
        
        {/* Transaction Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <ThemedText className="text-base opacity-70">Amount</ThemedText>
            <ThemedText className="text-lg font-bold">
              ${transaction.amount || transaction.price_usd} USD
            </ThemedText>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <ThemedText className="text-base opacity-70">Recipient</ThemedText>
            <ThemedText className="text-lg font-bold">
              {transaction.vendorName || transaction.vendor_name}
            </ThemedText>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <ThemedText className="text-base opacity-70">Transaction ID</ThemedText>
            <ThemedText className="text-lg font-bold">
              {transaction.paymentId || transaction.payment_id}
            </ThemedText>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <ThemedText className="text-base opacity-70">Date & Time</ThemedText>
            <ThemedText className="text-lg font-bold">
              {formatDate(transaction.createdAt || transaction.created_at || new Date())}
            </ThemedText>
          </View>
        </View>
        
        {/* Close Button */}
        <TouchableOpacity 
          style={[
            styles.closeButton,
            { backgroundColor: colorScheme === 'dark' ? '#3B82F6' : '#2563EB' }
          ]}
          onPress={onClose}
        >
          <ThemedText className="text-white text-center font-bold text-lg">
            Done
          </ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsContainer: {
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    opacity: 0.5,
  },
  closeButton: {
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
});

export default TransactionSuccess;