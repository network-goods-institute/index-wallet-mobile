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
  Alert,
  Image,
  ActivityIndicator
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
      const paymentId = currentTransaction?.payment_id || (currentTransaction as any).paymentId;
      const transactionData = currentTransaction?.unsigned_transaction ? 
        JSON.parse(currentTransaction.unsigned_transaction) : undefined;
      
      if (!paymentId || !transactionData) {
        throw new Error('Missing payment ID or unsigned transaction data');
      }
      
      const payerAddress = auth?.walletAddress;
      if (!payerAddress) {
        throw new Error('Wallet address not found in auth context');
      }
      
      const privateKey = auth?.keyPair?.privateKey;
      
      const response = await signAndSendTransaction(
        paymentId, 
        transactionData, 
        currentTransaction, 
        payerAddress,
        privateKey
      );
      
      if (response && response.status) {
        const successStatuses = ['completed', 'success', 'confirmed', 'Completed', 'Success', 'Confirmed'];
        const isSuccess = successStatuses.includes(response.status);
        
        if (isSuccess) {
          await refreshBalances();
          setCompletedTransaction(response);
          setShowSuccess(true);
          setShowModal(false);
        } else {
          Alert.alert('Payment Status', `Payment status: ${response.status}. Please check your transaction.`);
        }
      } else {
        await refreshBalances();
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

  // Transaction details modal - Apple style bottom sheet
  const renderTransactionModal = () => {
    if (!currentTransaction) return null;
    
    const amount = currentTransaction.amount || (currentTransaction as any).price_usd;
    const vendorName = currentTransaction.vendor_name || (currentTransaction as any).vendor_name;
    const paymentBundle = (currentTransaction as any).payment_bundle || [];
    
    // Get token colors based on symbol
    const getTokenColor = (symbol: string) => {
      const colors: { [key: string]: string } = {
        'ETH': '#627EEA',
        'USDC': '#2775CA',
        'USDT': '#26A17B',
        'DAI': '#F5AC37',
        'WBTC': '#F09242',
        'BTC': '#F7931A',
      };
      return colors[symbol] || '#6B7280';
    };
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={resetPayment}
        presentationStyle="pageSheet"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={resetPayment}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={[
              styles.bottomSheet,
              { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF' }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />
            
            {/* Header */}
            <View style={styles.sheetHeader}>
              <ThemedText className="text-xl font-semibold text-center">
                Confirm Payment
              </ThemedText>
            </View>
            
            {/* Amount Section */}
            <View style={styles.amountSection}>
              <ThemedText className="text-5xl font-bold text-center mb-2">
                ${amount}
              </ThemedText>
              <ThemedText className="text-lg text-center opacity-60">
                to {vendorName}
              </ThemedText>
            </View>
            
            {/* Token Breakdown */}
            <View style={styles.breakdownSection}>
              <ThemedText className="text-sm font-medium opacity-60 mb-4">
                PAYMENT BREAKDOWN
              </ThemedText>
              
              {paymentBundle.map((item: any, index: number) => (
                <View 
                  key={index} 
                  style={[
                    styles.tokenRow,
                    { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7' }
                  ]}
                >
                  <View style={styles.tokenInfo}>
                    {/* Token Icon */}
                    {item.token_image_url ? (
                      <Image 
                        source={{ uri: item.token_image_url }}
                        style={styles.tokenIcon}
                      />
                    ) : (
                      <View 
                        style={[
                          styles.tokenIcon,
                          { backgroundColor: getTokenColor(item.symbol) }
                        ]}
                      >
                        <ThemedText className="text-white font-bold text-lg">
                          {item.symbol.charAt(0)}
                        </ThemedText>
                      </View>
                    )}
                    
                    {/* Token Details */}
                    <View style={styles.tokenDetails}>
                      <ThemedText className="text-base font-semibold">
                        {item.symbol}
                      </ThemedText>
                      <ThemedText className="text-sm opacity-60">
                        {item.amount_to_pay.toFixed(6)} tokens
                      </ThemedText>
                    </View>
                  </View>
                  
                  {/* USD Value */}
                  <ThemedText className="text-base font-semibold">
                    ${item.amount_to_pay.toFixed(2)}
                  </ThemedText>
                </View>
              ))}
              
              {/* Total */}
              <View style={styles.totalRow}>
                <ThemedText className="text-base font-medium">
                  Total
                </ThemedText>
                <ThemedText className="text-lg font-bold">
                  ${amount} USD
                </ThemedText>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.button,
                  styles.cancelButton,
                  { backgroundColor: colorScheme === 'dark' ? '#48484A' : '#E5E5EA' }
                ]}
                onPress={resetPayment}
              >
                <ThemedText className="text-center font-semibold text-base">
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.button,
                  styles.approveButton,
                  { 
                    backgroundColor: processing || isLoading ? '#4ADE80' : '#22C55E',
                    opacity: processing || isLoading ? 0.7 : 1
                  }
                ]}
                disabled={processing || isLoading}
                onPress={handleCompletePayment}
              >
                {processing || isLoading ? (
                  <View style={styles.processingContainer}>
                    <ThemedText className="text-white text-center font-semibold text-base mr-2">
                      Processing
                    </ThemedText>
                    <Ionicons name="sync" size={18} color="#FFFFFF" />
                  </View>
                ) : (
                  <ThemedText className="text-white text-center font-semibold text-base">
                    Approve Payment
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Safe area padding */}
            <View style={{ height: Platform.OS === 'ios' ? 20 : 0 }} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }]}>
      {showSuccess && completedTransaction ? (
        <TransactionSuccess 
          transaction={completedTransaction}
          onClose={resetPayment}
        />
      ) : (
        <>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <View style={[
                styles.iconBackground,
                { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#EBF5FF' }
              ]}>
                <Ionicons 
                  name="scan" 
                  size={32} 
                  color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} 
                />
              </View>
            </View>
            <ThemedText className="text-3xl font-bold text-center mb-2">
              Scan to Pay
            </ThemedText>
            <ThemedText className="text-base text-center opacity-60">
              Scan a QR code or enter payment code
            </ThemedText>
          </View>
          
          {/* Camera placeholder with modern styling */}
          <View style={styles.cameraContainer}>
            <View style={[styles.camera, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F3F4F6' }]}>
              {/* Yellow corners with gradient */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Camera content */}
              <View style={styles.cameraContent}>
                <View style={[
                  styles.cameraIconContainer,
                  { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }
                ]}>
                  <Ionicons 
                    name="camera" 
                    size={40} 
                    color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} 
                  />
                </View>
                
                <ThemedText className="text-center text-base mt-4 opacity-70">
                  Position QR code within frame
                </ThemedText>
              </View>
              
              {/* Corner guides */}
              <View style={styles.guideContainer}>
                <View style={[styles.guide, { borderColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }]} />
              </View>
            </View>
          </View>
          
          {/* Bottom input area with modern styling */}
          <View style={styles.bottomContainer}>
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }]} />
              <ThemedText className="text-sm opacity-60 px-4">OR</ThemedText>
              <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }]} />
            </View>
            
            <View style={styles.inputSection}>
              {showInput ? (
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#F9FAFB',
                          color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                          borderColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
                          textAlign: 'center'
                        }
                      ]}
                      placeholder="Enter payment code"
                      placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                      value={paymentCode}
                      onChangeText={setPaymentCode}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading && !processing}
                    />
                    <TouchableOpacity 
                      style={[
                        styles.submitButton,
                        { 
                          backgroundColor: isLoading || processing || !paymentCode.trim() ? '#9CA3AF' : '#3B82F6',
                          opacity: isLoading || processing || !paymentCode.trim() ? 0.6 : 1
                        }
                      ]}
                      onPress={handlePaymentCodeSubmit}
                      disabled={isLoading || processing || !paymentCode.trim()}
                    >
                      {isLoading || processing ? (
                        <View style={styles.loadingButton}>
                          <ActivityIndicator color="#FFFFFF" size="small" />
                          <ThemedText className="text-white font-semibold ml-2">
                            Processing...
                          </ThemedText>
                        </View>
                      ) : (
                        <View style={styles.submitContent}>
                          <ThemedText className="text-white font-semibold">
                            Submit
                          </ThemedText>
                          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.cancelInputButton}
                    onPress={() => {
                      setShowInput(false);
                      setPaymentCode('');
                    }}
                  >
                    <ThemedText className="text-center opacity-60">
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[
                    styles.codeButton,
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
                      borderColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB'
                    }
                  ]}
                  onPress={() => setShowInput(true)}
                >
                  <View style={styles.codeButtonContent}>
                    <Ionicons 
                      name="keypad" 
                      size={24} 
                      color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} 
                    />
                    <ThemedText className="font-semibold text-base ml-3">
                      Enter Code Manually
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Loading indicator */}
          {(isLoading || processing) && !showInput && (
            <View style={styles.loadingOverlay}>
              <View style={[
                styles.loadingContainer,
                { backgroundColor: colorScheme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)' }
              ]}>
                <ActivityIndicator 
                  size="large" 
                  color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} 
                  style={{ marginBottom: 16 }}
                />
                <ThemedText className="text-lg font-medium">
                  Processing payment...
                </ThemedText>
                <ThemedText className="text-sm opacity-60 mt-2">
                  Please wait while we process your request
                </ThemedText>
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
  headerSection: {
    paddingTop: 20,
    paddingBottom: 8,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 8,
  },
  camera: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cameraContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  cameraIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  guideContainer: {
    position: 'absolute',
    top: '20%',
    bottom: '20%',
    left: '15%',
    right: '15%',
  },
  guide: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  corner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderColor: '#FCD34D',
    borderWidth: 4,
  },
  topLeft: {
    top: 24,
    left: 24,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 24,
    right: 24,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 24,
    left: 24,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 24,
    right: 24,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 16,
  },
  bottomContainer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  inputSection: {
    height: 100,
    justifyContent: 'center',
  },
  codeButton: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  codeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    height: 56,
  },
  submitButton: {
    paddingHorizontal: 24,
    borderRadius: 16,
    minWidth: 120,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelInputButton: {
    marginTop: 12,
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 0,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#C7C7CC',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  amountSection: {
    paddingVertical: 32,
  },
  breakdownSection: {
    paddingVertical: 20,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenDetails: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 0.4,
  },
  approveButton: {
    flex: 0.6,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingContainer: {
    padding: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
    minWidth: 280,
  },
});