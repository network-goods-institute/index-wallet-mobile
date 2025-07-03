import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { X, AlertTriangle } from 'lucide-react-native';

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  colorScheme: 'light' | 'dark';
}

export default function LogoutModal({ 
  visible, 
  onClose, 
  onConfirm, 
  colorScheme 
}: LogoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
    onClose();
  };
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black/50' : 'bg-black/30'}`}>
        <TouchableOpacity 
          className="flex-1 justify-center items-center px-6"
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            className={`w-full max-w-sm p-8 rounded-3xl ${colorScheme === 'dark' ? 'bg-gray-800/95' : 'bg-white'}`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Close button */}
            <TouchableOpacity 
              className="absolute top-4 right-4 p-2"
              onPress={onClose}
            >
              <X size={24} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
            
            {/* Warning Icon */}
            <View className={`w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 ${
              colorScheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
            }`}>
              <AlertTriangle size={40} color={colorScheme === 'dark' ? '#EF4444' : '#DC2626'} />
            </View>
            
            <Text className={`text-center text-2xl font-bold mb-2 ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Sign Out
            </Text>
            <Text className={`text-center text-base mb-8 ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Are you sure you want to sign out? You will need your seed phrase to log back in.
            </Text>
            
            {/* Action Button */}
            <TouchableOpacity 
              className={`py-4 px-8 rounded-2xl items-center ${isLoading ? 'opacity-50' : ''}`}
              style={{ 
                backgroundColor: colorScheme === 'dark' ? '#DC2626' : '#DC2626',
                shadowColor: '#DC2626',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
              onPress={handleConfirm}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base text-center">
                {isLoading ? 'Signing out...' : 'Sign Out'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onClose} 
              className="py-4"
              disabled={isLoading}
            >
              <Text className={`text-center text-base ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}