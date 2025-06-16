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
  const { clearActivePayment, clearActiveRequest } = useActiveTransaction();
  const [transactionType, setTransactionType] = useState<'pay' | 'receive'>('pay');
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }}>
      <ThemedView className="flex-1">
        <View className="flex-1">
          {transactionType === 'pay' ? <Pay /> : <Receive />}
        </View>

        <View className="flex-row text-white justify-center items-center pb-24 gap-12">
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
      </ThemedView>
    </SafeAreaView>
  );
}

export default function TransactScreen() {
  return (
    <ActiveTransactionProvider>
      <TransactContent />
    </ActiveTransactionProvider>
  );
}
