import React from 'react';
import { SafeAreaView, TouchableOpacity, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedView } from '@/components/core/ThemedView';
import { ThemedText } from '@/components/core/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import TransactionHistory from '@/components/wallet/TransactionHistory';
import { ArrowLeft } from 'lucide-react-native';

export default function HistoryScreen() {
  const { colorScheme } = useTheme();
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Transaction History',
          headerShown: true,
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
          },
          headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingLeft: 16 }}
            >
              <ArrowLeft 
                size={24} 
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
              />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' 
      }}>
        <ThemedView className="flex-1">
          <TransactionHistory 
            limit={50}  // Show more transactions on dedicated page
            showTitle={false}  // Title is in the header
          />
        </ThemedView>
      </SafeAreaView>
    </>
  );
}