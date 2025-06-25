import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useActiveTransaction } from '@/contexts/ActiveTransactionContext';
import { usePendingTransactionManager } from '@/contexts/PendingTransactionManager';
import { useTransactionHistory } from '@/contexts/TransactionHistoryStore';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'react-native-qrcode-svg';
import { QrCode, Copy, Check, ArrowLeft, Clock, X } from 'lucide-react-native';
import TransactionSuccess from '@/components/transaction/TransactionSuccess';
import * as Clipboard from 'expo-clipboard';

interface ReceiveProps {
  onSuccessStateChange?: (isSuccess: boolean) => void;
}

export default function Receive({ onSuccessStateChange }: ReceiveProps) {
  const { colorScheme } = useTheme();
  const { activeRequest, createRequest, deleteRequest, clearActiveRequest, isLoading, error } = useActiveTransaction();
  const { pendingTransactions, syncTransactions, clearAllCaches } = usePendingTransactionManager();
  const { transactions: historyTransactions, loadTransactionHistory } = useTransactionHistory();
  const auth = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Filter vendor's pending transactions (excluding the active one and expired)
  const MAX_TRANSACTION_AGE = 60 * 60 * 1000; // 1 hour
  const now = Date.now();
  
  const vendorPendingTransactions = pendingTransactions
    .filter(t => {
      // Check if vendor's transaction
      if (t.vendor_address !== auth?.walletAddress) return false;
      
      // Exclude completed, cancelled, expired transactions
      const excludedStatuses = ['completed', 'Completed', 'cancelled', 'Cancelled', 'expired', 'Expired', 'failed', 'Failed'];
      if (excludedStatuses.includes(t.status)) return false;
      
      // Check if expired (older than 1 hour)
      const createdAtMs = t.created_at < 10000000000 ? t.created_at * 1000 : t.created_at;
      const age = now - createdAtMs;
      if (age > MAX_TRANSACTION_AGE) {
        return false;
      }
      
      return true;
    })
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
    syncTransactions();
    loadTransactionHistory();
  }, []);
  
  // Watch for completed transaction
  useEffect(() => {
    if (activeRequest) {
      const completedStatuses = ['completed', 'success', 'confirmed', 'Completed', 'Success', 'Confirmed'];
      if (completedStatuses.includes(activeRequest.status)) {
        setShowSuccess(true);
      }
    }
  }, [activeRequest?.status]);
  
  // Notify parent about success state
  useEffect(() => {
    onSuccessStateChange?.(showSuccess);
  }, [showSuccess, onSuccessStateChange]);

  const handleCreatePayment = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      const newPaymentId = await createRequest(parseFloat(amount));
      setPaymentId(newPaymentId);
      // Auto-show QR code after creating
      setQrVisible(true);
      // Keep amount to show in QR view
      // Polling starts automatically in createRequest
      setTransactionDetails({
        paymentId: newPaymentId,
        amount: parseFloat(amount),
        createdAt: new Date().toISOString()
      });
      
      // Don't sync immediately - let the local update from createRequest take effect
      // The background sync will pick it up from the backend later
    } catch (error) {
      console.error('Failed to create payment:', error);
      Alert.alert('Error', 'Failed to create payment request');
    }
  };

  const handleCopyId = async () => {
    if (paymentId) {
      await Clipboard.setStringAsync(paymentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    clearActiveRequest();
    setQrVisible(false);
    setPaymentId(null);
    setTransactionDetails(null);
    setAmount('');
    setShowSuccess(false);
    onSuccessStateChange?.(false);
  };
  
  const handleCancel = async () => {
    if (paymentId && activeRequest) {
      setIsCancelling(true);
      try {
        // Delete the payment request from backend
        await deleteRequest(paymentId);
        
        // Clear the form
        setQrVisible(false);
        setPaymentId(null);
        setTransactionDetails(null);
        setAmount('');
        
        // Don't sync immediately - the local removal will take effect
        // Background sync will update from backend later
      } catch (error) {
        console.error('Failed to cancel payment:', error);
        Alert.alert('Error', 'Failed to cancel payment. Please try again.');
        // Even if delete fails, clear the UI
        clearActiveRequest();
        setQrVisible(false);
        setPaymentId(null);
        setTransactionDetails(null);
        setAmount('');
      } finally {
        setIsCancelling(false);
      }
    } else {
      // No active request, just clear the form
      clearActiveRequest();
      setQrVisible(false);
      setPaymentId(null);
      setTransactionDetails(null);
      setAmount('');
    }
  };

  return (
    <>
      {showSuccess && activeRequest ? (
        <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }}>
          <TransactionSuccess 
            transaction={activeRequest}
            onClose={resetForm}
            isVendor={true}
          />
        </View>
      ) : (
        <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }}>
          <ThemedView className="flex-1 relative">
            <>
                <ScrollView 
            className="flex-1 px-6 pt-8" 
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="items-center mb-8 mt-8">
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
            <View className="mb-8">
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

                  {/* Bottom padding to prevent overlap with Pay/Receive toggle */}
                  <View className="h-24" />
                </ScrollView>
                
                {/* Transaction History Icon - Outside ScrollView */}
                {(vendorPendingTransactions.length > 0 || vendorCompletedTransactions.length > 0) && (
                  <TouchableOpacity
                    className="absolute top-12 right-4 bg-gray-100 dark:bg-gray-800 p-3 rounded-full shadow-lg z-10"
                    onPress={() => setShowHistoryModal(true)}
                  >
                    <Clock size={24} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    {vendorPendingTransactions.length > 0 && (
                      <View className={`absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center ${
                        vendorPendingTransactions.some(t => {
                          const createdAtMs = t.created_at < 10000000000 ? t.created_at * 1000 : t.created_at;
                          const ageMinutes = Math.floor((now - createdAtMs) / 60000);
                          return ageMinutes > 30;
                        }) ? 'bg-orange-500' : 'bg-yellow-500'
                      }`}>
                        <ThemedText className="text-white text-xs font-bold">
                          {vendorPendingTransactions.length}
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </>
          </ThemedView>
          
          {/* QR Code Modal */}
          <Modal
            visible={qrVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setQrVisible(false)}
          >
            <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
              <SafeAreaView className="flex-1 justify-center items-center">
                <View className="bg-white dark:bg-black mx-4 rounded-3xl" style={{ width: '90%', maxWidth: 400 }}>
                  <ScrollView 
                    contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Modal Header */}
                    <View className="flex-row items-center justify-between py-4">
                      <TouchableOpacity
                        onPress={() => {
                          setQrVisible(false);
                          syncTransactions();
                        }}
                        className="p-2"
                      >
                        <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
                      </TouchableOpacity>
                      <ThemedText className="text-lg font-bold flex-1 text-center mr-8">Payment Request</ThemedText>
                    </View>
                    
                    {/* QR Code Display */}
                    <View className="items-center">
                      {/* Amount Display */}
                      <View className="mb-6">
                        <ThemedText className="text-center text-sm opacity-60 mb-1">Amount to receive</ThemedText>
                        <ThemedText className="text-4xl font-bold text-center" style={{ fontFamily: 'System' }}>
                          ${amount}
                        </ThemedText>
                      </View>

                      {/* QR Code */}
                      {paymentId && (
                        <View className="mb-6">
                          <View className="bg-white p-6 rounded-3xl shadow-lg">
                            <QRCode
                              value={paymentId}
                              size={180}
                              backgroundColor="white"
                              color="black"
                            />
                          </View>
                          <ThemedText className="text-xs opacity-60 text-center mt-3">Scan to pay</ThemedText>
                        </View>
                      )}

                      {/* Payment Code */}
                      {paymentId && (
                        <View className="w-full mb-6">
                          <View className="flex-row items-center justify-center mb-4">
                            <View className="h-px bg-gray-300 dark:bg-gray-700 flex-1" />
                            <ThemedText className="text-xs font-medium mx-3 opacity-60">
                              OR ENTER CODE
                            </ThemedText>
                            <View className="h-px bg-gray-300 dark:bg-gray-700 flex-1" />
                          </View>
                          <View className="items-center">
                            <View className="flex-row items-center">
                              <ThemedText 
                                className="font-bold" 
                                style={{ 
                                  fontSize: 28,
                                  letterSpacing: 3,
                                  fontFamily: 'System',
                                  lineHeight: 36
                                }}
                              >
                                {paymentId}
                              </ThemedText>
                              <TouchableOpacity
                                onPress={handleCopyId}
                                activeOpacity={0.7}
                                className="ml-3"
                              >
                                {copied ? (
                                  <Check size={24} color={colorScheme === 'dark' ? '#10B981' : '#059669'} />
                                ) : (
                                  <Copy size={24} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View className="w-full mt-4">
                        <TouchableOpacity
                          className={`py-3 rounded-xl flex-row items-center justify-center ${
                            isCancelling ? 'bg-gray-400' : colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                          }`}
                          onPress={handleCancel}
                          disabled={isCancelling}
                          activeOpacity={0.8}
                        >
                          {isCancelling ? (
                            <ActivityIndicator color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} size="small" />
                          ) : (
                            <ThemedText className={`text-center text-base font-semibold ${
                              colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              Cancel Request
                            </ThemedText>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </SafeAreaView>
            </View>
          </Modal>
      
      {/* Transaction History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="flex-1 mt-20 rounded-t-3xl" style={{ backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF' }}>
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-4 border-b" style={{ borderBottomColor: colorScheme === 'dark' ? '#48484A' : '#E5E5EA' }}>
              <ThemedText className="text-xl font-bold">Payment History</ThemedText>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
            
            {/* Modal Content */}
            <ScrollView className="flex-1 p-4">
              {/* Pending Payments */}
              {vendorPendingTransactions.length > 0 && (
                <View className="mb-6">
                  <ThemedText className="text-lg font-semibold mb-3">Waiting Payments ({vendorPendingTransactions.length})</ThemedText>
                  {vendorPendingTransactions.map((transaction) => {
                    // Convert to milliseconds if created_at is in seconds
                    const createdAtMs = transaction.created_at < 10000000000 ? transaction.created_at * 1000 : transaction.created_at;
                    const age = Date.now() - createdAtMs;
                    const ageMinutes = Math.floor(age / 60000);
                    const ageHours = Math.floor(age / 3600000);
                    const ageDays = Math.floor(age / 86400000);
                    
                    let ageText = 'Just now';
                    if (ageDays > 0) {
                      ageText = `${ageDays}d ago`;
                    } else if (ageHours > 0) {
                      ageText = `${ageHours}h ago`;
                    } else if (ageMinutes > 0) {
                      ageText = `${ageMinutes}m ago`;
                    }
                    
                    // Mark as stale if older than 30 minutes
                    const isStale = ageMinutes > 30;
                    const statusColor = isStale ? 'bg-orange-500' : 'bg-yellow-500';
                    const statusText = isStale ? 'Expiring soon' : 'Waiting';
                    
                    return (
                      <TouchableOpacity
                        key={transaction.payment_id}
                        className={`p-4 rounded-xl mb-2 flex-row items-center justify-between ${
                          isStale 
                            ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' 
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                        onPress={() => {
                          setPaymentId(transaction.payment_id);
                          setAmount(transaction.price_usd.toString());
                          setQrVisible(true);
                          setShowHistoryModal(false);
                        }}
                      >
                        <View className="flex-1">
                          <ThemedText className="text-lg font-semibold">${transaction.price_usd}</ThemedText>
                          <ThemedText className="text-sm opacity-60">{ageText} • {statusText}</ThemedText>
                        </View>
                        <View className={`${statusColor} w-3 h-3 rounded-full`} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              
              {/* Completed Payments */}
              {vendorCompletedTransactions.length > 0 && (
                <View className="mb-6">
                  <ThemedText className="text-lg font-semibold mb-3">Completed Payments</ThemedText>
                  {vendorCompletedTransactions.slice(0, 10).map((transaction) => {
                    // Convert to milliseconds if created_at is in seconds
                    const createdAtMs = transaction.created_at < 10000000000 ? transaction.created_at * 1000 : transaction.created_at;
                    const age = Date.now() - createdAtMs;
                    const ageMinutes = Math.floor(age / 60000);
                    const ageHours = Math.floor(age / 3600000);
                    const ageDays = Math.floor(age / 86400000);
                    
                    let ageText = 'Just now';
                    if (ageDays > 0) {
                      ageText = `${ageDays}d ago`;
                    } else if (ageHours > 0) {
                      ageText = `${ageHours}h ago`;
                    } else if (ageMinutes > 0) {
                      ageText = `${ageMinutes}m ago`;
                    }
                    
                    return (
                      <View
                        key={transaction.payment_id}
                        className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl mb-2 flex-row items-center justify-between opacity-75"
                      >
                        <View className="flex-1">
                          <ThemedText className="text-lg font-semibold">${transaction.price_usd}</ThemedText>
                          <ThemedText className="text-sm opacity-60">{ageText}</ThemedText>
                          {transaction.customer_address && (
                            <ThemedText className="text-xs opacity-50 mt-1">
                              From: {transaction.customer_address.slice(0, 8)}...
                            </ThemedText>
                          )}
                        </View>
                        <View className="bg-green-500 w-3 h-3 rounded-full" />
                      </View>
                    );
                  })}
                </View>
              )}
              
              {/* Empty State */}
              {vendorPendingTransactions.length === 0 && vendorCompletedTransactions.length === 0 && (
                <View className="flex-1 items-center justify-center py-20">
                  <Clock size={48} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                  <ThemedText className="text-lg mt-4">No payment history yet</ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
        </SafeAreaView>
      )}
    </>
  );
}

