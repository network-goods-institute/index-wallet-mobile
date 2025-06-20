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
            className="absolute left-0 right-0 flex-row justify-center items-center"
            style={{ zIndex: 10, bottom: 120 }}
          >
            <View className="flex-row bg-white/90 rounded-full p-1 shadow-lg">
              <TouchableOpacity 
                onPress={() => switchView('pay')}
                className={`px-8 py-3 rounded-full ${transactionType === 'pay' ? 'bg-gray-200' : ''}`}
              >
                <ThemedText className={`text-base font-semibold ${transactionType === 'pay' ? 'text-gray-900' : 'text-gray-600'}`}>Pay</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => switchView('receive')}
                className={`px-8 py-3 rounded-full ${transactionType === 'receive' ? 'bg-gray-200' : ''}`}
              >
                <ThemedText className={`text-base font-semibold ${transactionType === 'receive' ? 'text-gray-900' : 'text-gray-600'}`}>Receive</ThemedText>
              </TouchableOpacity>
            </View>
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
          className="absolute left-0 right-0 flex-row justify-center items-center"
          style={{ zIndex: 10, bottom: 120 }}
        >
          <View className={`flex-row ${colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-full p-1 shadow-lg`}>
            <TouchableOpacity 
              onPress={() => switchView('pay')}
              className={`px-8 py-3 rounded-full ${transactionType === 'pay' ? (colorScheme === 'dark' ? 'bg-gray-700' : 'bg-white') : ''}`}
            >
              <ThemedText className={`text-base font-semibold ${transactionType === 'pay' ? '' : 'opacity-60'}`}>Pay</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => switchView('receive')}
              className={`px-8 py-3 rounded-full ${transactionType === 'receive' ? (colorScheme === 'dark' ? 'bg-gray-700' : 'bg-white') : ''}`}
            >
              <ThemedText className={`text-base font-semibold ${transactionType === 'receive' ? '' : 'opacity-60'}`}>Receive</ThemedText>
            </TouchableOpacity>
          </View>
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
