import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useBalance } from '@/contexts/BalanceContext';
import { CheckCircle, Copy, ExternalLink } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface TransactionSuccessProps {
  transaction: any;
  onClose: () => void;
  isVendor?: boolean;
}

// Confetti particle component
const ConfettiParticle = ({ delay }: { delay: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const randomX = Math.random() * width;
  const randomRotation = Math.random() * 720 - 360;
  const randomColor = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][Math.floor(Math.random() * 6)];

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 3000,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, height + 100],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, Math.random() * 100 - 50, Math.random() * 200 - 100],
  });

  const rotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${randomRotation}deg`],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          left: randomX,
          backgroundColor: randomColor,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { rotate },
          ],
        },
      ]}
    />
  );
};

const TransactionSuccess: React.FC<TransactionSuccessProps> = ({ transaction, onClose, isVendor = false }) => {
  const { colorScheme } = useTheme();
  const { refreshBalances } = useBalance();
  const checkAnimation = useRef(new Animated.Value(0)).current;
  const contentAnimation = useRef(new Animated.Value(0)).current;
  
  // Format timestamp to readable date
  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp * 1000) 
      : new Date(timestamp);
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTransactionId = (id: string) => {
    if (!id) return '';
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  };

  useEffect(() => {
    // Animate check mark
    Animated.spring(checkAnimation, {
      toValue: 1,
      tension: 20,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Animate content
    Animated.timing(contentAnimation, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();
    
    // Refresh balances after successful transaction with a small delay
    // to ensure backend has processed the transaction
    const refreshTimer = setTimeout(() => {
      console.log('TransactionSuccess: Refreshing balances after successful transaction');
      refreshBalances().catch(error => {
        console.error('Failed to refresh balances after transaction:', error);
      });
    }, 1500); // 1.5 second delay
    
    return () => clearTimeout(refreshTimer);
  }, []);

  const checkScale = checkAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  const contentOpacity = contentAnimation;
  const contentTranslateY = contentAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const amount = transaction.amount || transaction.price_usd;
  const vendorName = transaction.vendor_name || transaction.vendorName;
  const paymentId = transaction.payment_id || transaction.paymentId;
  const paymentBundle = transaction.payment_bundle || [];

  return (
    <ThemedView className="flex-1">
      <SafeAreaView style={styles.container}>
        {/* Confetti Animation */}
        <View style={styles.confettiContainer}>
          {[...Array(20)].map((_, index) => (
            <ConfettiParticle key={index} delay={index * 100} />
          ))}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Success Icon */}
          <Animated.View style={[styles.successIcon, { transform: [{ scale: checkScale }] }]}>
            <View style={styles.checkCircle}>
              <CheckCircle size={60} color="#FFFFFF" strokeWidth={3} />
            </View>
          </Animated.View>

          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            {/* Success Message */}
            <ThemedText className="text-3xl font-bold text-center mb-2">
              {isVendor ? 'Payment Received!' : 'Payment Successful!'}
            </ThemedText>
            <ThemedText className="text-lg text-center opacity-60 mb-8">
              {isVendor ? 'The payment has been received' : 'Your payment has been processed'}
            </ThemedText>

            {/* Amount Card */}
            <View style={[
              styles.amountCard,
              { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }
            ]}>
              <ThemedText className="text-5xl font-bold text-center mb-2">
                ${amount}
              </ThemedText>
              <ThemedText className="text-lg text-center opacity-60">
                {isVendor ? 'Received' : `Paid to ${vendorName}`}
              </ThemedText>
            </View>

            {/* Transaction Details */}
            <View style={styles.detailsSection}>
              <View style={[
                styles.detailCard,
                { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#FFFFFF' }
              ]}>
                <View style={styles.detailRow}>
                  <ThemedText className="text-sm opacity-60">Transaction ID</ThemedText>
                  <TouchableOpacity style={styles.copyButton}>
                    <ThemedText className="text-sm font-medium mr-2">
                      {formatTransactionId(paymentId)}
                    </ThemedText>
                    <Copy size={16} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <ThemedText className="text-sm opacity-60">Date & Time</ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {formatDate(transaction.created_at || new Date())}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Token Breakdown */}
            {paymentBundle.length > 0 && (
              <View style={styles.breakdownSection}>
                <ThemedText className="text-sm font-medium opacity-60 mb-3">
                  TOKENS USED
                </ThemedText>
                {paymentBundle.map((item: any, index: number) => (
                  <View 
                    key={index}
                    style={[
                      styles.tokenRow,
                      { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#FFFFFF' }
                    ]}
                  >
                    <View style={styles.tokenInfo}>
                      {item.token_image_url ? (
                        <Image 
                          source={{ uri: item.token_image_url }}
                          style={styles.tokenIcon}
                        />
                      ) : (
                        <View style={[
                          styles.tokenIcon,
                          { backgroundColor: '#6B7280' }
                        ]}>
                          <ThemedText className="text-white font-bold">
                            {item.symbol.charAt(0)}
                          </ThemedText>
                        </View>
                      )}
                      
                      <View style={styles.tokenDetails}>
                        <ThemedText className="font-semibold">
                          {item.symbol}
                        </ThemedText>
                        <ThemedText className="text-xs opacity-60">
                          {item.amount_to_pay.toFixed(6)}
                        </ThemedText>
                      </View>
                    </View>
                    
                    <ThemedText className="font-semibold">
                      ${item.amount_to_pay.toFixed(2)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.doneButton,
                  { backgroundColor: colorScheme === 'dark' ? '#007AFF' : '#007AFF' }
                ]}
                onPress={onClose}
              >
                <ThemedText className="text-white text-center font-semibold text-lg">
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
  },
  amountCard: {
    padding: 32,
    borderRadius: 24,
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownSection: {
    marginBottom: 32,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenDetails: {
    flex: 1,
  },
  buttonContainer: {
    gap: 16,
  },
  doneButton: {
    paddingVertical: 18,
    borderRadius: 16,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
});

export default TransactionSuccess;