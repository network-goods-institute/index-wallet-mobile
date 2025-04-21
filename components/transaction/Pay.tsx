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
import TransactionSuccess from './TransactionSuccess';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');
const CORNER_SIZE = 70;

export default function Pay() {
  const { colorScheme } = useTheme();
  const [paymentCode, setPaymentCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  
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
    clearTransaction();
  };

  // Handle complete payment
  const handleCompletePayment = async () => {
    if (!currentTransaction) return;
    
    setProcessing(true);
    
    try {
      // For debugging, always succeed without calling the backend
      // const paymentId = currentTransaction.paymentId || 
      //                  (currentTransaction as any).payment_id;
      // const success = await completeTransaction(paymentId);
      
      // Mock success for debugging
      const success = true;
      
      if (success) {
        // Show success screen
        setShowModal(false);
        setShowSuccess(true);
      } else {
        // Show error
        Alert.alert('Error', 'Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'An unknown error occurred');
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
    const vendorName = currentTransaction.vendorName || 
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
      {showSuccess && currentTransaction ? (
        <TransactionSuccess 
          transaction={currentTransaction}
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
