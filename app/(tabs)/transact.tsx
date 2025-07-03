import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/core/ThemedText';
import Pay from '@/components/wallet/transaction/Pay';
import Receive from '@/components/wallet/transaction/Receive';
import { ActiveTransactionProvider } from '@/contexts/ActiveTransactionContext';

// Toggle button component
function ToggleButton({ 
  type, 
  isActive, 
  onPress 
}: { 
  type: 'pay' | 'receive';
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`px-8 py-3 rounded-full ${isActive ? 'bg-white' : ''}`}
    >
      <ThemedText className={`text-base font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
        {type === 'pay' ? 'Pay' : 'Receive'}
      </ThemedText>
    </TouchableOpacity>
  );
}

// Inner component that can access transaction context
function TransactContent() {
  const [transactionType, setTransactionType] = useState<'pay' | 'receive'>('pay');
  const [hideToggle, setHideToggle] = useState(false);

  const switchView = (type: 'pay' | 'receive') => {
    if (type !== transactionType) {
      setTransactionType(type);
    }
  };

  // Pass callback to children to hide toggle
  const handleSuccessStateChange = (isSuccess: boolean) => {
    setHideToggle(isSuccess);
  };

  return (
    <View style={{ flex: 1 }}>
      {transactionType === 'pay' ? (
        <Pay onSuccessStateChange={handleSuccessStateChange} />
      ) : (
        <Receive onSuccessStateChange={handleSuccessStateChange} />
      )}
      
      {!hideToggle && (
        <View 
          className="absolute left-0 right-0 flex-row justify-center items-center"
          style={{ zIndex: 10, bottom: 120 }}
        >
          <View className="flex-row bg-gray-100 rounded-full p-1 shadow-lg">
            <ToggleButton 
              type="pay"
              isActive={transactionType === 'pay'}
              onPress={() => switchView('pay')}
            />
            <ToggleButton 
              type="receive"
              isActive={transactionType === 'receive'}
              onPress={() => switchView('receive')}
            />
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
