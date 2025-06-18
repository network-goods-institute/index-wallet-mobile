import React, { useEffect, useState, useRef } from 'react';
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
  ActivityIndicator,
  Animated,
  StatusBar
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useActiveTransaction } from '@/contexts/ActiveTransactionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/contexts/BalanceContext';
import TransactionSuccess from './TransactionSuccess';
import Ionicons from '@expo/vector-icons/Ionicons';
import { signAndSendTransaction } from '@/services/transactionSigningService';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import Svg, { Defs, Rect, Mask } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface PayProps {
  onSuccessStateChange?: (isSuccess: boolean) => void;
}

export default function Pay({ onSuccessStateChange }: PayProps) {
  const { colorScheme } = useTheme();
  const auth = useAuth();
  const { refreshBalances } = useBalance();
  
  // State variables
  const [paymentCode, setPaymentCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Notify parent about success state
  useEffect(() => {
    onSuccessStateChange?.(showSuccess);
  }, [showSuccess, onSuccessStateChange]);
  const [completedTransaction, setCompletedTransaction] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  
  // Animation for input transition
  const inputAnimation = useRef(new Animated.Value(0)).current;
  
  // Ref for text input
  const inputRef = useRef<TextInput>(null);
  
  // Animation values for modal
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(height)).current;
  
  // Get transaction functions from context
  const { 
    activePayment,
    initiatePayment,
    completePayment,
    clearActivePayment,
    isLoading
  } = useActiveTransaction();

  // Show modal when activePayment is available
  useEffect(() => {
    if (activePayment) {
      console.log('==========================================');
      console.log('ACTIVE PAYMENT IN PAY COMPONENT:');
      console.log('==========================================');
      console.log(JSON.stringify(activePayment, null, 2));
      console.log('==========================================');
      console.log('Transaction type:', typeof activePayment);
      console.log('Has payment_bundle:', !!activePayment.payment_bundle);
      console.log('Payment bundle length:', activePayment.payment_bundle?.length || 0);
      console.log('==========================================');
      setShowModal(true);
    }
  }, [activePayment]);
  
  // Animate input transition and focus input when shown
  useEffect(() => {
    Animated.timing(inputAnimation, {
      toValue: showInput ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Focus input after animation
    if (showInput && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showInput]);

  // Animate modal when showModal changes
  useEffect(() => {
    if (showModal) {
      // Fade in overlay and slide up sheet
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 20,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      modalOpacity.setValue(0);
      sheetTranslateY.setValue(height);
    }
  }, [showModal]);

  // Handle payment code submission
  const handlePaymentCodeSubmit = async (code?: string) => {
    const codeToUse = code || paymentCode;
    if (!codeToUse.trim() || processing || isLoading) return;
    
    setProcessing(true);
    console.log('==========================================');
    console.log(`PAYMENT CODE SUBMITTED: ${codeToUse}`);
    console.log('==========================================');
    
    try {
      // Refresh balances to ensure we have the latest data
      await refreshBalances();
      
      // Initiate payment to get payment details
      await initiatePayment(codeToUse);
      
      // Clear the input
      setPaymentCode('');
      setShowInput(false);
      setScanned(false); // Reset scan state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      console.log('Payment error:', errorMessage);
      
      // Show user-friendly error alert
      Alert.alert(
        'Payment Error',
        errorMessage,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Reset payment state on error
              setPaymentCode('');
              setShowInput(false);
            }
          }
        ]
      );
      setScanned(false); // Allow rescanning on error
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
    clearActivePayment();
    onSuccessStateChange?.(false);
  };

  // Handle complete payment
  const handleCompletePayment = async () => {
    if (!activePayment) return;
    
    setProcessing(true);
    try {
      const paymentId = activePayment?.payment_id || (activePayment as any).paymentId;
      const transactionData = activePayment?.unsigned_transaction ? 
        JSON.parse(activePayment.unsigned_transaction) : undefined;
      
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
        activePayment, 
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
        await completePayment(paymentId);
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
    if (!activePayment) return null;
    
    const amount = activePayment.amount || (activePayment as any).price_usd;
    const vendorName = activePayment.vendor_name || (activePayment as any).vendor_name;
    const paymentBundle = (activePayment as any).payment_bundle || [];
    
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
        animationType="none"
        transparent={true}
        visible={showModal}
        onRequestClose={resetPayment}
        presentationStyle="overFullScreen"
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: modalOpacity,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.modalOverlayTouch} 
            activeOpacity={1} 
            onPress={resetPayment}
          >
            <Animated.View 
              style={[
                styles.bottomSheet,
                { 
                  backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                  transform: [{ translateY: sheetTranslateY }]
                }
              ]}
            >
              <TouchableOpacity 
                activeOpacity={1} 
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
                ${amount || '0'}
              </ThemedText>
              <ThemedText className="text-lg text-center opacity-60">
                to {vendorName || 'Unknown'}
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
                        {item.amount_to_pay?.toFixed(6) || '0.000000'} tokens
                      </ThemedText>
                    </View>
                  </View>
                  
                  {/* USD Value */}
                  <ThemedText className="text-base font-semibold">
                    ${item.amount_to_pay?.toFixed(2) || '0.00'}
                  </ThemedText>
                </View>
              ))}
              
              {/* Total */}
              <View style={styles.totalRow}>
                <ThemedText className="text-base font-medium">
                  Total
                </ThemedText>
                <ThemedText className="text-lg font-bold">
                  ${amount || '0'} USD
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
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    );
  };

  // Handle barcode scan
  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned || processing || isLoading) return;
    
    setScanned(true);
    console.log(`QR code scanned with type ${type} and data ${data}`);
    
    // Process the payment code
    handlePaymentCodeSubmit(data);
  };


  if (!permission) {
    // Camera permissions are still loading
    return (
      <View className={`flex-1 items-center justify-center ${colorScheme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <View className="flex-1 justify-center items-center p-5">
          <View className={`p-10 rounded-3xl items-center shadow-lg max-w-md w-full ${
            colorScheme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
              colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Ionicons 
                name="camera" 
                size={48} 
                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} 
              />
            </View>
            <ThemedText className="text-2xl font-bold text-center mb-3">
              Camera Access Required
            </ThemedText>
            <ThemedText className="text-base text-center opacity-60 mb-8 px-4">
              To scan QR codes, please allow camera access
            </ThemedText>
            <TouchableOpacity
              className="py-4 px-8 bg-blue-500 rounded-full"
              onPress={requestPermission}
            >
              <ThemedText className="text-white text-base font-semibold">Grant Permission</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      {showSuccess && completedTransaction ? (
        <View className="flex-1 bg-black" style={{ zIndex: 999 }}>
          <TransactionSuccess 
            transaction={completedTransaction}
            onClose={resetPayment}
          />
        </View>
      ) : (
        <>
          {/* Full screen camera */}
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "pdf417"],
            }}
          />
          
          {/* Overlay UI - minimal design */}
          <View style={StyleSheet.absoluteFillObject}>
            {/* SVG Mask for rounded cutout */}
            <Svg 
              width={width} 
              height={height} 
              style={StyleSheet.absoluteFillObject}
              viewBox={`0 0 ${width} ${height}`}
            >
              <Defs>
                <Mask id="mask">
                  <Rect x="0" y="0" width={width} height={height} fill="white" />
                  <Rect 
                    x={(width - width * 0.7) / 2} 
                    y={(height - width * 0.7) / 2} 
                    width={width * 0.7} 
                    height={width * 0.7} 
                    rx="12" 
                    ry="12" 
                    fill="black" 
                  />
                </Mask>
              </Defs>
              <Rect x="0" y="0" width={width} height={height} fill="rgba(0, 0, 0, 0.8)" mask="url(#mask)" />
            </Svg>
            
            {/* Text below scan area */}
            <View 
              className="absolute left-0 right-0 items-center"
              style={{ 
                top: (height - width * 0.7) / 2 + width * 0.7 + 20, // Position below scan frame
              }}
            >
              <ThemedText className="text-white text-xl font-semibold text-center">Scan Code to Pay</ThemedText>
              <ThemedText className="text-white/80 text-base text-center mt-1">Position code within frame</ThemedText>
            </View>
            
            {/* Corner markers */}
            <View style={styles.scanFrame}>
              <View style={[styles.cornerMarker, styles.topLeftCorner]} />
              <View style={[styles.cornerMarker, styles.topRightCorner]} />
              <View style={[styles.cornerMarker, styles.bottomLeftCorner]} />
              <View style={[styles.cornerMarker, styles.bottomRightCorner]} />
            </View>
            
            {/* Top controls - positioned at top of viewable camera area */}
            <View 
              className="absolute left-0 right-0 px-5" 
              style={{ 
                top: (height - width * 0.7) / 2 - 80, // Position above scan frame
              }}
            >
              <View style={{ height: 56 }}> {/* Fixed height container */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    opacity: inputAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                  }}
                >
                  {!showInput ? (
                    <TouchableOpacity 
                      className="flex-row items-center justify-center bg-white/15 py-4 px-6 rounded-full border border-white/30"
                      onPress={() => setShowInput(true)}
                    >
                      <Ionicons name="keypad" size={24} color="#FFFFFF" />
                      <ThemedText className="text-white text-base font-semibold ml-3">Enter Code Manually</ThemedText>
                    </TouchableOpacity>
                  ) : null}
                </Animated.View>
                
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    opacity: inputAnimation,
                  }}
                >
                {showInput ? (
                  <View className="flex-row items-center gap-3">
                    <TouchableOpacity 
                      className="w-12 h-12 bg-white/10 rounded-full items-center justify-center"
                      onPress={() => {
                        setShowInput(false);
                        setPaymentCode('');
                      }}
                    >
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TextInput
                      ref={inputRef}
                      className="flex-1 bg-white/15 border border-white/30 rounded-full py-3.5 px-5 text-base text-white"
                      placeholder="Enter payment code"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={paymentCode}
                      onChangeText={setPaymentCode}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading && !processing}
                      returnKeyType="done"
                      onSubmitEditing={() => handlePaymentCodeSubmit()}
                      autoFocus={false} // We'll handle focus manually
                    />
                    <TouchableOpacity 
                      className={`w-14 h-14 bg-blue-500 rounded-full items-center justify-center${
                        (!paymentCode.trim() || processing || isLoading) ? ' opacity-50' : ''
                      }`}
                      onPress={() => handlePaymentCodeSubmit()}
                      disabled={isLoading || processing || !paymentCode.trim()}
                    >
                      {isLoading || processing ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}
                </Animated.View>
              </View>
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
                  size="small" 
                  color="#E5E7EB" 
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
    </>
  );
}

const styles = StyleSheet.create({
  scanFrame: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    top: (height - width * 0.7) / 2,
    left: (width - width * 0.7) / 2,
  },
  cornerMarker: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: '#FCD34D',
    borderWidth: 3,
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  keyboardAvoid: {
    width: '100%',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlayTouch: {
    flex: 1,
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