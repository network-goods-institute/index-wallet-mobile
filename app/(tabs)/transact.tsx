import React, { useState } from 'react';
import { View, TouchableOpacity, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Pay from '@/components/transaction/Pay';
import Receive from '@/components/transaction/Receive';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  interpolate
} from 'react-native-reanimated';
import { ActiveTransactionProvider, useActiveTransaction } from '@/contexts/ActiveTransactionContext';
import { useTheme } from '@/contexts/ThemeContext';

// Inner component that can access transaction context
function TransactContent() {
  const { colorScheme } = useTheme();
  const { clearActivePayment, clearActiveRequest, activePayment, activeRequest } = useActiveTransaction();
  const [transactionType, setTransactionType] = useState<'pay' | 'receive'>('pay');
  const [hideToggle, setHideToggle] = useState(false);
  const progress = useSharedValue(0); // 0 = pay, 1 = receive

  const payTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0.3])
  }));

  const receiveTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.3, 1])
  }));

  const switchView = (type: 'pay' | 'receive') => {
    if (type !== transactionType) {
      // Just switch view without clearing states
      progress.value = withSpring(type === 'pay' ? 0 : 1);
      setTransactionType(type);
    }
  };

  // Pass callback to children to hide toggle
  const handleSuccessStateChange = (isSuccess: boolean) => {
    setHideToggle(isSuccess);
  };

  // For Pay view, render fullscreen without SafeAreaView
  if (transactionType === 'pay') {
    return (
      <View style={{ flex: 1 }}>
        <Pay onSuccessStateChange={handleSuccessStateChange} />
        {!hideToggle && (
          <View 
            className="absolute bottom-0 left-0 right-0 flex-row justify-center items-center pb-12 gap-12 bg-transparent"
            style={{ zIndex: 1 }}
          >
            <TouchableOpacity onPress={() => switchView('pay')}>
              <Animated.View style={payTextStyle}>
                <ThemedText className="text-base text-white">Pay</ThemedText>
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchView('receive')}>
              <Animated.View style={receiveTextStyle}>
                <ThemedText className="text-base text-white">Receive</ThemedText>
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // For Receive view, match Pay layout structure
  return (
    <View style={{ flex: 1 }}>
      <Receive onSuccessStateChange={handleSuccessStateChange} />
      {!hideToggle && (
        <View 
          className="absolute bottom-0 left-0 right-0 flex-row justify-center items-center pb-12 gap-12 bg-transparent"
          style={{ zIndex: 1 }}
        >
          <TouchableOpacity onPress={() => switchView('pay')}>
            <Animated.View style={payTextStyle}>
              <ThemedText className="text-base">Pay</ThemedText>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => switchView('receive')}>
            <Animated.View style={receiveTextStyle}>
              <ThemedText className="text-base">Receive</ThemedText>
            </Animated.View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function TransactScreen() {
  return (
    <ActiveTransactionProvider>
      <TransactContent />
    </ActiveTransactionProvider>
  );
}
