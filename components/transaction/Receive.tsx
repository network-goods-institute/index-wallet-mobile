import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useTransaction } from '@/contexts/TransactionContext';
import QRCode from 'react-native-qrcode-svg';

export default function Receive() {
  const { colorScheme } = useTheme();
  const { createTransaction, pollTransactionStatus, stopPolling, currentTransaction, isLoading, error } = useTransaction();
  const [amount, setAmount] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  // Clean up polling when component unmounts
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Watch for transaction status changes

  const handleCreatePayment = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      console.log("CREATING PAYMENT: ")
      // Create transaction with amount only - auth details are handled in the context
      const newPaymentId = await createTransaction(parseFloat(amount));
      setPaymentId(newPaymentId);
      setQrVisible(true);
      
      // Start polling for status updates
      pollTransactionStatus(newPaymentId);

      // For testing: Display transaction details
      setTransactionDetails({
        paymentId: newPaymentId,
        amount: parseFloat(amount),
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to create payment:', error);
      Alert.alert('Error', 'Failed to create payment request');
    }
  };

  return (
    <View className="flex-1 items-center justify-center px-6">
      {!qrVisible ? (
        <>
          <View className="flex-row items-center justify-center mb-8">
            <ThemedText className="text-4xl font-bold">$</ThemedText>
            <TextInput
              className="text-6xl font-bold text-center w-48 text-black dark:text-white"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colorScheme === 'dark' ? '#666' : '#999'}
            />
            <ThemedText className="text-4xl font-bold">USD</ThemedText>
          </View>
          
          <TouchableOpacity
            className="bg-blue-500 py-3 px-6 rounded-lg"
            onPress={handleCreatePayment}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText className="text-white text-lg font-semibold">
                Generate Payment QR
              </ThemedText>
            )}
          </TouchableOpacity>

          {/* We can still display transaction context info for testing */}
          <View className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <ThemedText className="font-bold mb-2">Transaction Status:</ThemedText>
            <ThemedText>Status: {currentTransaction?.status || 'No active transaction'}</ThemedText>
            {currentTransaction && (
              <>
                <ThemedText>Amount: ${currentTransaction.amount}</ThemedText>
                <ThemedText>Payment ID: {currentTransaction.paymentId}</ThemedText>
              </>
            )}
          </View>
        </>
      ) : (
        <View className="items-center">
          <ThemedText className="text-2xl font-bold mb-4">
            Scan to Pay ${amount}
          </ThemedText>
          
          {paymentId && (
            <View className="bg-white p-4 rounded-lg mb-4">
              <QRCode
                value={paymentId}
                size={200}
                backgroundColor="white"
                color="black"
              />
            </View>
          )}
          
          <View className="flex-row items-center mt-2">
            <View className={`h-3 w-3 rounded-full mr-2 ${
              currentTransaction?.status === 'pending' ? 'bg-yellow-500' :
              currentTransaction?.status === 'calculated' ? 'bg-blue-500' :
              currentTransaction?.status === 'confirmed' ? 'bg-green-500' :
              'bg-gray-500'
            }`} />
            <ThemedText>
              Status: {currentTransaction?.status || 'waiting'}
            </ThemedText>
          </View>

          {/* Display transaction details for testing */}
          {transactionDetails && (
            <View className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg w-full">
              <ThemedText className="font-bold mb-2">Transaction Details:</ThemedText>
              <ThemedText>ID: {transactionDetails.paymentId}</ThemedText>
              <ThemedText>Amount: ${transactionDetails.amount}</ThemedText>
              <ThemedText>Created: {new Date(transactionDetails.createdAt).toLocaleTimeString()}</ThemedText>
            </View>
          )}
          
          <TouchableOpacity
            className="bg-gray-500 py-2 px-4 rounded-lg mt-8"
            onPress={() => {
              stopPolling();
              setQrVisible(false);
              setPaymentId(null);
              setTransactionDetails(null);
            }}
          >
            <ThemedText className="text-white">Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
