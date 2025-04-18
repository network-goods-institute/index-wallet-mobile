import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useTransaction } from '@/contexts/TransactionContext';


export default function Pay() {
  const { colorScheme } = useTheme();
  const [paymentCode, setPaymentCode] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Get transaction functions from context
  const { 
    supplementTransaction,
    isLoading,
    error,
    currentTransaction
  } = useTransaction();

  // this is the same as if scanned from QR, will register from a useEffect
  const handlePaymentCodeSubmit = async () => {

    // set some level of loading state: 
    if (!paymentCode.trim() || processing || isLoading) return;
    setProcessing(true);
    console.log(`Processing payment code: ${paymentCode}`);
    
    try {
      await supplementTransaction(paymentCode);
      // Clear the input
      setPaymentCode('');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to supplement transaction';
      console.log(errorMessage)
    } finally {
      setProcessing(false);
    }
  };

  // Render payment details when currentTransaction is available
  const renderPaymentDetails = () => {
    if (!currentTransaction) return null;
    
    return (
      <View className="bg-gray-800 p-4 rounded-xl my-4">
        <ThemedText className="text-xl font-bold mb-2">Payment Details</ThemedText>
        <ThemedText className="text-lg mb-1">Amount: ${currentTransaction.amount || currentTransaction.price_usd}USD</ThemedText>
        <ThemedText className="text-lg mb-3">Vendor: {currentTransaction.vendorName || currentTransaction.vendor_name}</ThemedText>
        
        <View className="flex-row mt-4 justify-between">
          <TouchableOpacity 
            className="bg-red-500 p-3 rounded-full flex-1 mr-2"
            onPress={() => {
              // Reset payment
              setPaymentCode('');
            }}
          >
            <ThemedText className="text-center text-white font-bold">Cancel</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-green-500 p-3 rounded-full flex-1 ml-2"
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
          onPress={() => setPaymentCode('')}
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
        {(isLoading || processing) && !currentTransaction && (
          <View className="items-center justify-center mt-4">
            <ThemedText className="text-lg">Processing payment...</ThemedText>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
