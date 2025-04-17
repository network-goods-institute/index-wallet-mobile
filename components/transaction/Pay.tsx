import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useTransaction } from '@/contexts/TransactionContext';
import { TokenBreakdown } from '@/contexts/TransactionContext';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentAPI } from '@/services/api';

export default function Pay() {
  const { colorScheme } = useTheme();
  const { walletAddress } = useAuth();
  const [paymentCode, setPaymentCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    paymentId: string;
    vendorAddress: string;
    vendorName: string;
    priceUsd: number;
    status: string;
    customerAddress?: string;
    createdAt?: number;
    payerHoldings?: any;
    calculatedPrice?: any;
  } | null>(null);
  
  // Get transaction functions from context
  const { 
    completeTransaction,
    isLoading,
    error
  } = useTransaction();

  const handlePaymentCodeSubmit = async () => {
    if (!paymentCode.trim() || processing || isLoading) return;
    
    setProcessing(true);
    console.log(`Processing payment code: ${paymentCode}`);
    
    try {
      if (!walletAddress) {
        throw new Error('Wallet address not available. Please log in.');
      }
      
      // First, get the payment details
      const paymentId = paymentCode.trim();
      const paymentResponse = await PaymentAPI.getPayment(paymentId);
      console.log('Payment details:', paymentResponse);
      
      // Then supplement the payment with payer address
      const supplementData = {
        payer_address: walletAddress
      };
      
      const supplementedPayment = await PaymentAPI.supplementPayment(paymentId, supplementData);
      console.log('Supplemented payment:', supplementedPayment);
      
      // Set payment details for display
      setPaymentDetails({
        paymentId: supplementedPayment.payment_id,
        vendorAddress: supplementedPayment.vendor_address,
        vendorName: supplementedPayment.vendor_name,
        priceUsd: supplementedPayment.price_usd,
        status: supplementedPayment.status,
        customerAddress: supplementedPayment.customer_address,
        createdAt: supplementedPayment.created_at,
        payerHoldings: supplementedPayment.payer_holdings,
        calculatedPrice: supplementedPayment.calculated_price
      });
      
      // Clear the input
      setPaymentCode('');
      
    } catch (err) {
      console.error('Payment error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to process payment code');
    } finally {
      setProcessing(false);
    }
  };

  const resetPayment = () => {
    setPaymentDetails(null);
    setPaymentCode('');
  };

  const handleCompletePayment = async () => {
    if (!paymentDetails) return;
    
    setProcessing(true);
    
    try {
      // Complete the transaction
      const success = await completeTransaction(paymentDetails.paymentId);
      
      if (success) {
        Alert.alert('Success', 'Payment completed successfully!');
        resetPayment();
      } else {
        Alert.alert('Error', 'Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment completion error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  // Show payment details if available
  const renderPaymentDetails = () => {
    if (!paymentDetails) return null;
    
    return (
      <View className="bg-gray-800 p-4 rounded-xl my-4">
        <ThemedText className="text-xl font-bold mb-2">Payment Details</ThemedText>
        <ThemedText className="text-lg mb-1">Amount: ${paymentDetails.priceUsd.toFixed(2)}</ThemedText>
        <ThemedText className="text-lg mb-3">Vendor: {paymentDetails.vendorName}</ThemedText>
        <ThemedText className="text-sm mb-1">Payment ID: {paymentDetails.paymentId}</ThemedText>
        <ThemedText className="text-sm mb-3">Status: {paymentDetails.status}</ThemedText>
        
        <View className="flex-row mt-4 justify-between">
          <TouchableOpacity 
            className="bg-red-500 p-3 rounded-full flex-1 mr-2"
            onPress={resetPayment}
          >
            <ThemedText className="text-center text-white font-bold">Cancel</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-green-500 p-3 rounded-full flex-1 ml-2"
            onPress={handleCompletePayment}
            disabled={processing || isLoading}
          >
            <ThemedText className="text-center text-white font-bold">
              {processing || isLoading ? 'Processing...' : 'Complete Payment'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Show error if any
  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <ThemedText className="text-base text-red-500 mb-4">{error}</ThemedText>
        <TouchableOpacity 
          className="bg-blue-500 p-3 rounded-full"
          onPress={resetPayment}
        >
          <ThemedText className="text-center text-white font-bold">Try Again</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 p-4">
        <View className="mb-6">
          <ThemedText className="text-xl font-bold mb-4">Pay with Code</ThemedText>
          <ThemedText className="text-base mb-4">
            Enter the payment code provided by the merchant to complete your transaction.
          </ThemedText>
        </View>
        
        {/* Payment code input */}
        <View className="mb-4">
          <TextInput
            className={`border-2 ${colorScheme === 'dark' ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'} p-4 rounded-xl text-lg`}
            placeholder="Enter payment code"
            placeholderTextColor={colorScheme === 'dark' ? '#9ca3af' : '#6b7280'}
            value={paymentCode}
            onChangeText={setPaymentCode}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading && !processing}
          />
        </View>
        
        {/* Submit button */}
        <TouchableOpacity 
          className={`p-4 rounded-xl ${isLoading || processing || !paymentCode.trim() ? 'bg-gray-500' : 'bg-blue-500'}`}
          onPress={handlePaymentCodeSubmit}
          disabled={isLoading || processing || !paymentCode.trim()}
        >
          <ThemedText className="text-center text-white font-bold text-lg">
            {isLoading || processing ? 'Processing...' : 'Submit Payment Code'}
          </ThemedText>
        </TouchableOpacity>
        
        {/* Payment details */}
        {renderPaymentDetails()}
        
        {/* Loading indicator */}
        {(isLoading || processing) && (
          <View className="items-center justify-center mt-4">
            <ThemedText className="text-lg">Processing payment...</ThemedText>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
