import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useTransaction } from '@/contexts/TransactionContext';
import QRCode from 'react-native-qrcode-svg';
import { QrCode, Copy, Check } from 'lucide-react-native';
import TransactionSuccess from '@/components/transaction/TransactionSuccess';

export default function Receive() {
  const { colorScheme } = useTheme();
  const { createTransaction, pollTransactionStatus, stopPolling, currentTransaction, isLoading, error, clearTransaction } = useTransaction();
  const [amount, setAmount] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Clean up polling when component unmounts
  useEffect(() => {
    return () => {
      console.log('Receive component unmounting, stopping polling');
      stopPolling();
    };
  }, []); // Remove stopPolling from dependencies to prevent re-running

  // Watch for completed transaction
  useEffect(() => {
    if (currentTransaction) {
      const completedStatuses = ['completed', 'success', 'confirmed', 'Completed', 'Success', 'Confirmed'];
      if (completedStatuses.includes(currentTransaction.status)) {
        console.log('Transaction completed! Showing success screen');
        setShowSuccess(true);
        stopPolling();
      }
    }
  }, [currentTransaction?.status]);

  const handleCreatePayment = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      const newPaymentId = await createTransaction(parseFloat(amount));
      setPaymentId(newPaymentId);
      setQrVisible(true);
      pollTransactionStatus(newPaymentId);
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

  const handleCopyId = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    stopPolling();
    clearTransaction();
    setQrVisible(false);
    setPaymentId(null);
    setTransactionDetails(null);
    setAmount('');
    setShowSuccess(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }}>
      <ThemedView className="flex-1">
        {showSuccess && currentTransaction ? (
          <TransactionSuccess 
            transaction={currentTransaction}
            onClose={resetForm}
            isVendor={true}
          />
        ) : !qrVisible ? (
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="items-center mb-12">
              <View className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mb-6">
                <QrCode size={40} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
              </View>
              <ThemedText className="text-3xl font-bold text-center mb-2">
                Request Payment
              </ThemedText>
              <ThemedText className="text-lg text-center opacity-60">
                Enter the amount you'd like to request
              </ThemedText>
            </View>

            {/* Amount Input */}
            <View className="mb-12">
              <View className="flex-row items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 mx-4">
                <ThemedText className="text-3xl font-bold mr-2">$</ThemedText>
                <TextInput
                  className="text-5xl font-bold text-center flex-1 text-black dark:text-white"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
                  style={{ minHeight: 80 }}
                />
                <ThemedText className="text-3xl font-bold ml-2">USD</ThemedText>
              </View>
            </View>

            {/* Generate Button */}
            <View className="px-4 mb-8">
              <TouchableOpacity
                className={`${
                  isLoading ? 'bg-gray-400' : 'bg-blue-500'
                } py-4 px-8 rounded-2xl shadow-lg`}
                onPress={handleCreatePayment}
                disabled={isLoading || !amount}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center">
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <QrCode size={24} color="#FFFFFF" />
                      <ThemedText className="text-white text-lg font-semibold ml-3">
                        Generate Payment QR
                      </ThemedText>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Transaction Status - Only show when active */}
            {currentTransaction && currentTransaction.status && currentTransaction.status !== 'No active transaction' && (
              <View className="mx-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <ThemedText className="text-lg font-semibold mb-2">Transaction Status</ThemedText>
                <View className="space-y-1">
                  <ThemedText className="text-base opacity-80">Status: {currentTransaction.status}</ThemedText>
                  {currentTransaction.amount && (
                    <ThemedText className="text-base opacity-80">Amount: ${currentTransaction.amount}</ThemedText>
                  )}
                  {currentTransaction.paymentId && (
                    <ThemedText className="text-base opacity-80">ID: {currentTransaction.paymentId}</ThemedText>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* QR Code Display */}
            <View className="items-center">
              <ThemedText className="text-2xl font-bold text-center mb-2">
                Payment Request
              </ThemedText>
              <ThemedText className="text-6xl font-bold text-blue-500 mb-6">
                ${amount}
              </ThemedText>
              
              {paymentId && (
                <View className="bg-white p-6 rounded-3xl shadow-lg mb-6">
                  <QRCode
                    value={paymentId}
                    size={240}
                    backgroundColor="white"
                    color="black"
                  />
                </View>
              )}

              {/* Payment ID */}
              {paymentId && (
                <View className="w-full max-w-sm mb-6">
                  <ThemedText className="text-sm font-medium mb-2 text-center opacity-60">
                    Payment ID
                  </ThemedText>
                  <TouchableOpacity
                    className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl flex-row items-center justify-between"
                    onPress={handleCopyId}
                  >
                    <ThemedText className="text-base font-mono flex-1 mr-2">
                      {paymentId}
                    </ThemedText>
                    {copied ? (
                      <Check size={20} color={colorScheme === 'dark' ? '#10B981' : '#059669'} />
                    ) : (
                      <Copy size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Status Indicator */}
              <View className="flex-row items-center mb-8">
                <View className={`w-3 h-3 rounded-full mr-3 ${
                  currentTransaction?.status === 'pending' ? 'bg-yellow-500' :
                  currentTransaction?.status === 'calculated' ? 'bg-blue-500' :
                  currentTransaction?.status === 'confirmed' ? 'bg-green-500' :
                  currentTransaction?.status === 'error' ? 'bg-red-500' :
                  'bg-gray-400'
                }`} />
                <ThemedText className="text-base font-medium">
                  {currentTransaction?.status === 'pending' ? 'Waiting for payment...' :
                   currentTransaction?.status === 'calculated' ? 'Payment calculated' :
                   currentTransaction?.status === 'confirmed' ? 'Payment confirmed!' :
                   currentTransaction?.status === 'error' ? 'Error checking status' :
                   'Waiting...'}
                </ThemedText>
              </View>

              {/* Action Buttons */}
              <View className="w-full max-w-sm space-y-3">
                <TouchableOpacity
                  className="bg-gray-500 py-4 px-8 rounded-xl"
                  onPress={resetForm}
                >
                  <ThemedText className="text-white text-center text-lg font-semibold">
                    Create New Request
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

