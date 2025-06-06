import React, { useEffect, useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  Modal,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useTransaction } from '@/contexts/TransactionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/contexts/BalanceContext';
import TransactionSuccess from './TransactionSuccess';
import Ionicons from '@expo/vector-icons/Ionicons';
import { signAndSendTransaction } from '@/services/transactionSigningService';

const { width, height } = Dimensions.get('window');
const CORNER_SIZE = 70;

export default function Pay() {
  const { colorScheme } = useTheme();
  const auth = useAuth();
  const { refreshBalances } = useBalance();
  
  // State variables
  const [paymentCode, setPaymentCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);
  
  // Get transaction functions from context
  const { 
    supplementTransaction,
    completeTransaction,
    isLoading,
    error,
    currentTransaction,
    clearTransaction
  } = useTransaction();

  // Show modal when transaction is available
  useEffect(() => {
    if (currentTransaction) {
      setShowModal(true);
    }
  }, [currentTransaction]);

  // Handle payment code submission
  const handlePaymentCodeSubmit = async () => {
    if (!paymentCode.trim() || processing || isLoading) return;
    
    setProcessing(true);
    console.log(`Processing payment code: ${paymentCode}`);
    
    try {
      await supplementTransaction(paymentCode);
      // Clear the input
      setPaymentCode('');
      setShowInput(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to supplement transaction';
      console.log(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Reset everything
  const resetPayment = () => {
    setPaymentCode('');
    setShowModal(false);
    setShowInput(false);
    setShowSuccess(false);
    setCompletedTransaction(null);
    clearTransaction();
  };

  // Handle complete payment
  const handleCompletePayment = async () => {
    if (!currentTransaction) return;
    
    setProcessing(true);
    try {
      // Debug auth context
      console.log('AUTH CONTEXT DEBUG:');
      console.log('- walletAddress:', auth?.walletAddress);
      console.log('- keyPair exists:', auth?.keyPair ? 'YES' : 'NO');
      console.log('- privateKey exists:', auth?.keyPair?.privateKey ? 'YES' : 'NO');
      if (auth?.keyPair?.privateKey) {
        console.log('- privateKey type:', typeof auth.keyPair.privateKey);
        console.log('- privateKey length:', auth.keyPair.privateKey.length);
      }
      
      // Get the payment ID and unsigned transaction data
      const paymentId = currentTransaction?.payment_id || (currentTransaction as any).paymentId;
      const transactionData = currentTransaction?.unsigned_transaction ? 
        JSON.parse(currentTransaction.unsigned_transaction) : undefined;
      
      if (!paymentId || !transactionData) {
        throw new Error('Missing payment ID or unsigned transaction data');
      }
      
      console.log('Starting payment completion for payment ID:', paymentId);
      console.log('Transaction from API:', JSON.stringify(currentTransaction, null, 2));
      
      // Get the payer address from the auth context
      const payerAddress = auth?.walletAddress;
      
      if (!payerAddress) {
        throw new Error('Wallet address not found in auth context');
      }
      
      // Get the private key from auth context
      const privateKey = auth?.keyPair?.privateKey;
      
      if (!privateKey) {
        console.warn('Private key not found in auth context, falling back to secure storage');
      } else {
        console.log('Using private key from auth context');
      }
      
      // Use the transaction signing service to sign and send the transaction
      const response = await signAndSendTransaction(
        paymentId, 
        transactionData, 
        currentTransaction, 
        payerAddress,
        privateKey // Pass the private key from auth context
      );
      console.log('Backend response:', response);
      
      // Check if the payment was successful based on the PaymentStatusResponse
      if (response && response.status) {
        console.log('Payment status:', response.status);
        
        // Check for success statuses (adjust these based on your backend's status values)
        const successStatuses = ['completed', 'success', 'confirmed', 'Completed', 'Success', 'Confirmed'];
        const isSuccess = successStatuses.includes(response.status);
        
        if (isSuccess) {
          console.log('Payment completed successfully, refreshing balances...');
          
          // Refresh user balances after successful payment
          try {
            await refreshBalances();
            console.log('Balances refreshed successfully');
          } catch (balanceError) {
            console.warn('Failed to refresh balances:', balanceError);
            // Don't fail the whole transaction if balance refresh fails
          }
          
          // Store the completed transaction with payment_bundle for success screen
          setCompletedTransaction(response);
          
          // Transaction is already completed after signing - show success screen directly
          setShowSuccess(true);
          setShowModal(false);
        } else {
          // Payment failed or pending
          console.log('Payment not completed, status:', response.status);
          Alert.alert('Payment Status', `Payment status: ${response.status}. Please check your transaction.`);
        }
      } else {
        // Fallback - assume success if we got a response but no status
        console.log('No status in response, assuming success');
        
        // Refresh balances
        try {
          await refreshBalances();
        } catch (balanceError) {
          console.warn('Failed to refresh balances:', balanceError);
        }
        
        // Complete the transaction in the context
        await completeTransaction(paymentId);
        
        setShowSuccess(true);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error completing payment:', error);
      Alert.alert('Payment Error', 'There was an error completing your payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Transaction details modal
  const renderTransactionModal = () => {
    if (!currentTransaction) return null;
    
    // Handle different property names in the transaction object
    const amount = currentTransaction.amount || 
                  (currentTransaction as any).price_usd;
    const vendorName = currentTransaction.vendor_name || 
                      (currentTransaction as any).vendor_name;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={resetPayment}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent, 
            { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }
          ]}>
            <ThemedText className="text-2xl font-bold mb-4">Payment Details</ThemedText>
            <ThemedText className="text-xl mb-2">
              Amount: ${amount} USD
            </ThemedText>
            <ThemedText className="text-lg mb-6">
              To: {vendorName}
            </ThemedText>
            
            <TouchableOpacity 
              className="flex-row justify-between w-full mb-6"
              onPress={() => setShowBreakdown(!showBreakdown)}
            >
              <ThemedText className="text-lg">
                Payment Breakdown 
              </ThemedText>
              <View className="flex items-center">
                <Ionicons 
                  name={showBreakdown ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colorScheme === 'dark' ? '#FFFFFF' : '#1F2937'} 
                />
              </View>
            </TouchableOpacity>

            {showBreakdown && currentTransaction && (currentTransaction as any).payment_bundle && (
              <View className="w-full mb-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
                <ThemedText className="text-lg font-semibold mb-2">Payment Bundle</ThemedText>
                {(currentTransaction as any).payment_bundle.map((item: any, index: number) => (
                  <View key={index} className="flex-row justify-between mb-2">
                    <ThemedText>
                      {item.symbol}:
                    </ThemedText>
                    <ThemedText className="font-semibold">
                      ${item.amount_to_pay.toFixed(2)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row justify-between w-full">
              <TouchableOpacity 
                className="bg-red-500 p-4 rounded-xl flex-1 mr-2"
                onPress={resetPayment}
              >
                <ThemedText className="text-center text-white font-bold text-lg">
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-green-500 p-4 rounded-xl flex-1 ml-2"
                disabled={processing || isLoading}
                onPress={handleCompletePayment}
              >
                <ThemedText className="text-center text-white font-bold text-lg">
                  {processing || isLoading ? 'Processing...' : 'Approve'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    <SafeAreaView style={styles.container}>
      {showSuccess && completedTransaction ? (
        <TransactionSuccess 
          transaction={completedTransaction}
          onClose={resetPayment}
        />
      ) : (
        <>
          {/* Camera placeholder with yellow corners */}
          <View style={styles.cameraContainer}>
            <View style={[styles.camera, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F0F0F0' }]}>
              {/* Yellow corners */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Camera message */}
              <ThemedText className="text-center text-lg">
                Point camera at QR code
              </ThemedText>
            </View>
          </View>
          
          {/* Bottom input area */}
          <View style={styles.bottomContainer}>
            {showInput ? (
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inputContainer}
              >
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#333333' : '#FFFFFF',
                      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                      borderColor: colorScheme === 'dark' ? '#555555' : '#CCCCCC'
                    }
                  ]}
                  placeholder="Enter payment code"
                  placeholderTextColor={colorScheme === 'dark' ? '#9ca3af' : '#6b7280'}
                  value={paymentCode}
                  onChangeText={setPaymentCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading && !processing}
                />
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    { backgroundColor: isLoading || processing || !paymentCode.trim() ? '#6B7280' : '#3B82F6' }
                  ]}
                  onPress={handlePaymentCodeSubmit}
                  disabled={isLoading || processing || !paymentCode.trim()}
                >
                  <ThemedText className="text-center text-white font-bold">
                    {isLoading || processing ? 'Processing...' : 'Submit'}
                  </ThemedText>
                </TouchableOpacity>
              </KeyboardAvoidingView>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.codeButton,
                  { backgroundColor: colorScheme === 'dark' ? '#333333' : '#FFFFFF' }
                ]}
                onPress={() => setShowInput(true)}
              >
                <ThemedText className="text-center font-bold text-lg">
                  Enter Code
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Loading indicator */}
          {(isLoading || processing) && (
            <View style={styles.loadingOverlay}>
              <View style={[
                styles.loadingContainer,
                { backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
              ]}>
                <ThemedText className="text-lg">Processing payment...</ThemedText>
              </View>
            </View>
          )}
          
          {/* Transaction modal */}
          {renderTransactionModal()}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    padding: 16,
  },
  camera: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#FFCC00',
    borderWidth: 5,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 20,
    right: 20,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 20,
  },
  bottomContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  codeButton: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginRight: 8,
    height: 50,
  },
  submitButton: {
    padding: 12,
    borderRadius: 12,
    minWidth: 100,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
