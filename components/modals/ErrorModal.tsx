import React from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { X } from 'lucide-react-native';

interface ErrorModalProps {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
  title?: string;
  message: string;
  emoji?: string;
  retryText?: string;
}

export default function ErrorModal({ 
  visible, 
  onClose, 
  onRetry,
  title = 'Connection Error',
  message,
  emoji = '⚠️',
  retryText = 'Try Again'
}: ErrorModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black/30">
        <TouchableOpacity 
          className="flex-1 justify-center items-center px-6"
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="w-full max-w-sm p-8 rounded-3xl bg-white"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Close button */}
            <TouchableOpacity 
              className="absolute top-4 right-4 p-2"
              onPress={onClose}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <View className="w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 bg-red-50">
              <Text className="text-3xl">{emoji}</Text>
            </View>
            
            <Text className="text-center text-2xl font-bold mb-2 text-gray-900">
              {title}
            </Text>
            <Text className="text-center text-base text-gray-600 mb-8">
              {message}
            </Text>
            
            {onRetry && (
              <TouchableOpacity 
                className="py-4 px-8 rounded-2xl items-center bg-blue-500"
                onPress={onRetry}
                style={{
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text className="text-white font-semibold text-lg">{retryText}</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}