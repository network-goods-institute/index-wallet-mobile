import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useActiveTransaction } from '@/contexts/ActiveTransactionContext';
import { usePendingTransactionManager } from '@/contexts/PendingTransactionManager';
import { useTransactionHistory } from '@/contexts/TransactionHistoryStore';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'react-native-qrcode-svg';
import { QrCode, Copy, Check, ArrowLeft } from 'lucide-react-native';
import TransactionSuccess from '@/components/transaction/TransactionSuccess';

export default function Receive() {
  const { colorScheme } = useTheme();
  const { activeRequest, createRequest, clearActiveRequest, isLoading, error } = useActiveTransaction();
  const { pendingTransactions, syncTransactions } = usePendingTransactionManager();
  const { transactions: historyTransactions, loadTransactionHistory } = useTransactionHistory();
  const auth = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Filter vendor's pending transactions (excluding the active one)
  const vendorPendingTransactions = pendingTransactions
    .filter(
      t => t.vendor_address === auth?.walletAddress && 
           t.payment_id !== activeRequest?.payment_id &&
           t.status !== 'completed' && 
           t.status !== 'Completed'
    )
    .sort((a, b) => b.created_at - a.created_at); // Sort by newest first
    
  // Filter vendor's completed transactions from both history and pending (as fallback)
  const allTransactions = [...historyTransactions, ...pendingTransactions];
  const vendorCompletedTransactions = allTransactions
    .filter(
      t => t.vendor_address === auth?.walletAddress &&
           (t.status === 'completed' || t.status === 'Completed' || 
            t.status === 'success' || t.status === 'Success' ||
            t.status === 'confirmed' || t.status === 'Confirmed')
    )
    .sort((a, b) => b.created_at - a.created_at) // Sort by newest first
    .filter((t, index, self) => 
      index === self.findIndex(item => item.payment_id === t.payment_id) // Remove duplicates
    );
  
  // Sync pending transactions on mount
  useEffect(() => {
    console.log('Receive component mounted, syncing transactions...');
    syncTransactions();
    loadTransactionHistory();
  }, []);
  
  // Debug effect to see pending transactions
  useEffect(() => {
    console.log('Pending transactions updated in Receive:', pendingTransactions.length);
    console.log('Active request:', activeRequest?.payment_id);
  }, [pendingTransactions, activeRequest]);

  // Note: We don't clear active request on unmount anymore
  // The ActiveTransactionContext is scoped to TransactScreen level
  // so it will persist when switching between Pay/Receive tabs

  // Watch for completed transaction
  useEffect(() => {
    if (activeRequest) {
      const completedStatuses = ['completed', 'success', 'confirmed', 'Completed', 'Success', 'Confirmed'];
      if (completedStatuses.includes(activeRequest.status)) {
        console.log('Transaction completed! Showing success screen');
        setShowSuccess(true);
      }
    }
  }, [activeRequest?.status]);

  const handleCreatePayment = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      const newPaymentId = await createRequest(parseFloat(amount));
      setPaymentId(newPaymentId);
      // Don't automatically show QR - let user see it in the list
      setQrVisible(false);
      setAmount(''); // Clear amount for next request
      // Polling starts automatically in createRequest
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
    clearActiveRequest();
    setQrVisible(false);
    setPaymentId(null);
    setTransactionDetails(null);
    setAmount('');
    setShowSuccess(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }}>
      <ThemedView className="flex-1">
        {showSuccess && activeRequest ? (
          <TransactionSuccess 
            transaction={activeRequest}
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
              
              {/* Debug: Refresh button */}
              <TouchableOpacity
                className="mt-2 py-2"
                onPress={() => {
                  console.log('Manual sync triggered');
                  syncTransactions();
                }}
              >
                <ThemedText className="text-center text-sm opacity-60">
                  Tap to refresh pending list
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Latest Request - Show prominently if exists */}
            {activeRequest && (
              <View className="mx-4 mt-6">
                <ThemedText className="text-lg font-semibold mb-3">Latest Request</ThemedText>
                <TouchableOpacity
                  className="p-4 bg-green-100 dark:bg-green-900 rounded-xl border-2 border-green-500"
                  onPress={() => {
                    setPaymentId(activeRequest.payment_id);
                    setAmount(activeRequest.price_usd.toString());
                    setQrVisible(true);
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <ThemedText className="text-2xl font-bold">${activeRequest.price_usd}</ThemedText>
                    <View className="bg-yellow-500 px-3 py-1 rounded-full">
                      <ThemedText className="text-white text-sm font-semibold">Waiting</ThemedText>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <ThemedText className="text-sm opacity-80">ID: {activeRequest.payment_id}</ThemedText>
                    <ThemedText className="text-sm font-medium text-green-600 dark:text-green-400">
                      Tap to show QR →
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* All Pending Requests */}
            {vendorPendingTransactions.length > 0 && (
              <View className="mx-4 mt-6">
                <ThemedText className="text-lg font-semibold mb-3">All Waiting Payments ({vendorPendingTransactions.length})</ThemedText>
                <View className="space-y-2">
                  {vendorPendingTransactions.map((transaction) => {
                    const age = Date.now() - transaction.created_at;
                    const ageMinutes = Math.floor(age / 60000);
                    const ageText = ageMinutes < 1 ? 'Just now' : `${ageMinutes} min ago`;
                    
                    return (
                      <TouchableOpacity
                        key={transaction.payment_id}
                        className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl flex-row items-center justify-between"
                        onPress={() => {
                          setPaymentId(transaction.payment_id);
                          setAmount(transaction.price_usd.toString());
                          setQrVisible(true);
                        }}
                      >
                        <View className="flex-1">
                          <ThemedText className="text-lg font-semibold">${transaction.price_usd}</ThemedText>
                          <ThemedText className="text-sm opacity-60">{ageText} • {transaction.status}</ThemedText>
                        </View>
                        <View className={`w-3 h-3 rounded-full ${
                          transaction.status === 'pending' || transaction.status === 'Created' ? 'bg-yellow-500' :
                          transaction.status === 'calculated' || transaction.status === 'Supplemented' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            
            {/* Completed Transactions */}
            {vendorCompletedTransactions.length > 0 && (
              <View className="mx-4 mt-6 mb-8">
                <ThemedText className="text-lg font-semibold mb-3">Completed Payments ({vendorCompletedTransactions.length})</ThemedText>
                <View className="space-y-2">
                  {vendorCompletedTransactions.slice(0, 5).map((transaction) => {
                    const age = Date.now() - transaction.created_at;
                    const ageMinutes = Math.floor(age / 60000);
                    const ageHours = Math.floor(age / 3600000);
                    const ageDays = Math.floor(age / 86400000);
                    
                    let ageText = 'Just now';
                    if (ageDays > 0) {
                      ageText = `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
                    } else if (ageHours > 0) {
                      ageText = `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
                    } else if (ageMinutes > 0) {
                      ageText = `${ageMinutes} min ago`;
                    }
                    
                    return (
                      <TouchableOpacity
                        key={transaction.payment_id}
                        className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl flex-row items-center justify-between opacity-75"
                        disabled={true} // Completed transactions are view-only
                      >
                        <View className="flex-1">
                          <ThemedText className="text-lg font-semibold">${transaction.price_usd}</ThemedText>
                          <ThemedText className="text-sm opacity-60">{ageText} • Completed</ThemedText>
                          {transaction.customer_address && (
                            <ThemedText className="text-xs opacity-50 mt-1">
                              From: {transaction.customer_address.slice(0, 8)}...
                            </ThemedText>
                          )}
                        </View>
                        <View className="bg-green-500 w-3 h-3 rounded-full" />
                      </TouchableOpacity>
                    );
                  })}
                  {vendorCompletedTransactions.length > 5 && (
                    <ThemedText className="text-sm text-center opacity-60 mt-2">
                      +{vendorCompletedTransactions.length - 5} more completed payments
                    </ThemedText>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <TouchableOpacity
              className="flex-row items-center mb-4 mt-4"
              onPress={() => setQrVisible(false)}
            >
              <ArrowLeft size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              <ThemedText className="text-lg font-medium ml-2">Back to Requests</ThemedText>
            </TouchableOpacity>
            
            {/* QR Code Display */}
            <View className="items-center mt-8">
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
                  activeRequest?.status === 'pending' ? 'bg-yellow-500' :
                  activeRequest?.status === 'calculated' ? 'bg-blue-500' :
                  activeRequest?.status === 'confirmed' ? 'bg-green-500' :
                  activeRequest?.status === 'error' ? 'bg-red-500' :
                  'bg-gray-400'
                }`} />
                <ThemedText className="text-base font-medium">
                  {activeRequest?.status === 'pending' ? 'Waiting for payment...' :
                   activeRequest?.status === 'calculated' ? 'Payment calculated' :
                   activeRequest?.status === 'confirmed' ? 'Payment confirmed!' :
                   activeRequest?.status === 'error' ? 'Error checking status' :
                   'Waiting...'}
                </ThemedText>
              </View>

              {/* Action Buttons */}
              <View className="w-full max-w-sm space-y-3">
                <TouchableOpacity
                  className="bg-blue-500 py-4 px-8 rounded-xl"
                  onPress={() => setQrVisible(false)}
                >
                  <ThemedText className="text-white text-center text-lg font-semibold">
                    Done
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

