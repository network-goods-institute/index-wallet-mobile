import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Modal, Text, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentAPI } from '@/services/api';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

// Transaction type matching the new API response
interface TransactionHistoryItem {
  payment_id: string;
  direction: 'Sent' | 'Received';
  counterparty_address: string;
  vendor_name?: string;
  status: string;
  price_usd: number;
  created_at: string | number; // Can be ISO 8601 datetime string or Unix timestamp
  computed_payment?: Array<{
    token_key: string;
    symbol: string;
    amount_to_pay: number;
    token_image_url?: string;
  }>;
}

interface TransactionHistoryProps {
  limit?: number;
  showTitle?: boolean;
}

export default function TransactionHistory({ limit = 10, showTitle = true }: TransactionHistoryProps) {
  const { colorScheme } = useTheme();
  const auth = useAuth();
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionHistoryItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async (isRefresh = false) => {
    if (!auth?.walletAddress) return;
    
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const response = await PaymentAPI.getTransactionHistory(auth.walletAddress);
      
      
      // Log first transaction to see structure
      if (response.transactions && response.transactions.length > 0) {
        console.log('Sample transaction structure:', JSON.stringify(response.transactions[0], null, 2));
      }
      
      // Only show the requested limit
      const limitedTransactions = (response.transactions || []).slice(0, limit);
      setTransactions(limitedTransactions);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
      setError('Failed to load transaction history');
      // For now, set some mock data if the API fails
      setTransactions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [auth?.walletAddress]);

  const isPending = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    return !['completed', 'success', 'confirmed', 'failed', 'cancelled', 'expired'].includes(normalizedStatus);
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (['completed', 'success', 'confirmed'].includes(normalizedStatus)) {
      return <CheckCircle size={16} color="#10B981" />;
    } else if (['failed', 'cancelled', 'expired'].includes(normalizedStatus)) {
      return <XCircle size={16} color="#EF4444" />;
    } else {
      return <Clock size={16} color="#F59E0B" />;
    }
  };

  const getTransactionTypeIcon = (transaction: TransactionHistoryItem) => {
    const isIncoming = transaction.direction === 'Received';
    const IconComponent = isIncoming ? ArrowDownLeft : ArrowUpRight;
    const color = isIncoming ? '#10B981' : '#6B7280'; // Green for received, gray for sent
    
    return <IconComponent size={20} color={color} />;
  };

  const formatDate = (timestamp: string | number) => {
    try {
      let date: Date;
      
      if (typeof timestamp === 'number') {
        // Auto-detect seconds vs milliseconds
        // Unix timestamps in seconds are typically 10 digits (until 2286)
        // Unix timestamps in milliseconds are typically 13 digits
        if (timestamp < 10000000000) {
          // Likely seconds - multiply by 1000
          date = new Date(timestamp * 1000);
        } else {
          // Likely milliseconds
          date = new Date(timestamp);
        }
      } else if (typeof timestamp === 'string') {
        // Try to parse as ISO string first
        date = new Date(timestamp);
        
        // If that fails, try parsing as a number
        if (isNaN(date.getTime())) {
          const numTimestamp = parseInt(timestamp, 10);
          if (!isNaN(numTimestamp)) {
            // Apply same logic for number timestamps
            date = new Date(numTimestamp < 10000000000 ? numTimestamp * 1000 : numTimestamp);
          } else {
            console.warn('Invalid date format:', timestamp);
            return 'Invalid date';
          }
        }
      } else {
        console.warn('Unexpected date type:', typeof timestamp, timestamp);
        return 'Invalid date';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date after parsing:', timestamp);
        return 'Invalid date';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      
      // Handle future dates
      if (diffMs < 0) {
        return 'Just now';
      }
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        // For older dates, show the actual date
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Unknown date';
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <ThemedView className="p-4">
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="small" color="#E5E7EB" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      {showTitle && (
        <View className="px-4 pt-4 pb-2">
          <ThemedText className="text-xl font-bold">Transaction History</ThemedText>
        </View>
      )}
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadTransactions(true)}
            tintColor="#E5E7EB"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View className="p-4">
            <ThemedText className="text-center text-red-500">{error}</ThemedText>
            <TouchableOpacity 
              className="mt-4 bg-blue-500 py-3 px-6 rounded-xl self-center"
              onPress={() => loadTransactions()}
            >
              <ThemedText className="text-white font-semibold">Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : transactions.length === 0 ? (
          <View className="p-8">
            <ThemedText className="text-center text-gray-500 dark:text-gray-400">
              No transactions yet
            </ThemedText>
          </View>
        ) : (
          <View className="px-4 pb-4">
            {transactions.map((transaction, index) => {
              const isIncoming = transaction.direction === 'Received';
              const otherParty = transaction.vendor_name || transaction.counterparty_address;
              
              return (
                <TouchableOpacity
                  key={transaction.payment_id}
                  className={`
                    bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-3
                    ${index === 0 ? 'mt-2' : ''}
                  `}
                  onPress={() => {
                    setSelectedTransaction(transaction);
                    setShowDetails(true);
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="relative mr-3">
                        <View className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center">
                          {getTransactionTypeIcon(transaction)}
                        </View>
                        <View className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-50 dark:border-gray-800"
                          style={{
                            backgroundColor: isPending(transaction.status) ? '#F59E0B' : '#10B981'
                          }}
                        />
                      </View>
                      
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <ThemedText className="font-semibold text-base">
                            {isPending(transaction.status) 
                              ? 'Transaction Created' 
                              : (isIncoming ? 'Payment Received' : 'Payment Sent')
                            }
                          </ThemedText>
                          <View className="ml-2">
                            {getStatusIcon(transaction.status)}
                          </View>
                        </View>
                        
                        <ThemedText className="text-sm opacity-60 mt-1">
                          {(() => {
                            if (isPending(transaction.status)) {
                              return isIncoming ? 'Requested from' : 'Paying to';
                            } else {
                              return isIncoming ? 'From' : 'To';
                            }
                          })()} {transaction.vendor_name || `${transaction.counterparty_address.slice(0, 8)}...`}
                        </ThemedText>
                        
                        <ThemedText className="text-xs opacity-50 mt-1">
                          {formatDate(transaction.created_at)}
                        </ThemedText>
                      </View>
                    </View>
                    
                    <View className="items-end">
                      <ThemedText className={`text-lg font-bold ${
                        isPending(transaction.status)
                          ? 'text-gray-400'
                          : (isIncoming ? 'text-green-500' : 'text-gray-700 dark:text-gray-300')
                      }`}>
                        {isIncoming ? '+' : '-'}${transaction.price_usd.toFixed(2)}
                      </ThemedText>
                      
                      <ThemedText className="text-xs opacity-50 mt-1">
                        #{transaction.payment_id}
                      </ThemedText>
                    </View>
                  </View>
                  
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
      
      {/* Transaction Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDetails}
        onRequestClose={() => setShowDetails(false)}
      >
        <BlurView
          intensity={20}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          {selectedTransaction && (
            <View 
              className="w-full rounded-3xl p-6 shadow-2xl"
              style={{ 
                backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                maxWidth: 400,
              }}
            >
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text 
                  className="text-2xl font-bold"
                  style={{ color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }}
                >
                  Transaction Details
                </Text>
                <TouchableOpacity onPress={() => setShowDetails(false)}>
                  <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
                </TouchableOpacity>
              </View>
              
              {/* Transaction Info */}
              <View className="space-y-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center mr-3">
                      {getTransactionTypeIcon(selectedTransaction)}
                    </View>
                    <View>
                      <ThemedText className={`text-2xl font-bold ${
                        isPending(selectedTransaction.status)
                          ? 'text-gray-400'
                          : (selectedTransaction.direction === 'Received' ? 'text-green-500' : 'text-gray-700 dark:text-gray-300')
                      }`}>
                        {selectedTransaction.direction === 'Received' ? '+' : '-'}${selectedTransaction.price_usd.toFixed(2)}
                      </ThemedText>
                      <ThemedText className="text-sm opacity-60">
                        {selectedTransaction.direction}
                      </ThemedText>
                    </View>
                  </View>
                  <View className="items-center">
                    {getStatusIcon(selectedTransaction.status)}
                    <ThemedText className="text-xs mt-1 capitalize">
                      {selectedTransaction.status}
                    </ThemedText>
                  </View>
                </View>
                
                <View className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <View className="mb-3">
                    <ThemedText className="text-sm opacity-60 mb-1">Payment ID</ThemedText>
                    <ThemedText className="font-mono text-sm">{selectedTransaction.payment_id}</ThemedText>
                  </View>
                  
                  <View className="mb-3">
                    <ThemedText className="text-sm opacity-60 mb-1">
                      {(() => {
                        const isIncoming = selectedTransaction.direction === 'Received';
                        if (isPending(selectedTransaction.status)) {
                          return isIncoming ? 'Requested from' : 'Paying to';
                        } else {
                          return isIncoming ? 'From' : 'To';
                        }
                      })()}
                    </ThemedText>
                    <ThemedText className="text-sm">
                      {selectedTransaction.vendor_name || selectedTransaction.counterparty_address}
                    </ThemedText>
                  </View>
                  
                  <View className="mb-3">
                    <ThemedText className="text-sm opacity-60 mb-1">Date</ThemedText>
                    <ThemedText className="text-sm">
                      {(() => {
                        const timestamp = selectedTransaction.created_at;
                        let date: Date;
                        if (typeof timestamp === 'number' && timestamp < 10000000000) {
                          date = new Date(timestamp * 1000);
                        } else {
                          date = new Date(timestamp);
                        }
                        return date.toLocaleString();
                      })()}
                    </ThemedText>
                  </View>
                  
                  {/* Enhanced Transaction Details */}
                  <View className="mb-3">
                    <ThemedText className="text-sm opacity-60 mb-1">Amount (USD)</ThemedText>
                    <ThemedText className="text-lg font-bold">
                      ${selectedTransaction.price_usd.toFixed(2)}
                    </ThemedText>
                  </View>
                  
                  {/* Token Details */}
                  {selectedTransaction.computed_payment && selectedTransaction.computed_payment.length > 0 && (
                    <View className="mt-4">
                      <ThemedText className="text-sm opacity-60 mb-2">Token Breakdown</ThemedText>
                      
                      {selectedTransaction.computed_payment.map((payment, index) => {
                        const [tokenAddress] = payment.token_key.split(',');
                        // Calculate USD value proportionally
                        const totalAmount = selectedTransaction.computed_payment!.reduce(
                          (sum, p) => sum + p.amount_to_pay, 0
                        );
                        const proportion = totalAmount > 0 ? (payment.amount_to_pay / totalAmount) : 0;
                        const usdValue = selectedTransaction.price_usd * proportion;
                        
                        return (
                          <View key={`${payment.token_key}-${index}`} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-2">
                            <View className="flex-row justify-between items-center">
                              <View className="flex-row items-center flex-1">
                                {payment.token_image_url ? (
                                  <Image 
                                    source={{ uri: payment.token_image_url }} 
                                    className="w-8 h-8 rounded-full mr-3"
                                    style={{
                                      borderWidth: 1,
                                      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                    }}
                                  />
                                ) : (
                                  <View 
                                    className="w-8 h-8 rounded-full mr-3 items-center justify-center"
                                    style={{ 
                                      backgroundColor: colorScheme === 'dark' ? '#4B5563' : '#E5E7EB',
                                      borderWidth: 1,
                                      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                    }}
                                  >
                                    <ThemedText className="text-xs font-bold">
                                      {payment.symbol.charAt(0)}
                                    </ThemedText>
                                  </View>
                                )}
                                <ThemedText className="font-semibold">
                                  {payment.amount_to_pay.toFixed(6)} {payment.symbol}
                                </ThemedText>
                              </View>
                              <ThemedText className="text-sm opacity-60 ml-2">
                                ${usdValue.toFixed(2)}
                              </ThemedText>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  
                </View>
              </View>
            </View>
          )}
        </BlurView>
      </Modal>
    </ThemedView>
  );
}