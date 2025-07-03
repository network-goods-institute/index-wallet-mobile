import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Modal, Text, Image, SafeAreaView } from 'react-native';
import { ThemedText } from '@/components/core/ThemedText';
import { ThemedView } from '@/components/core/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentAPI } from '@/services/api';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, X, Banknote } from 'lucide-react-native';

// Base activity interface
interface BaseActivity {
  type: 'transaction' | 'deposit';
  created_at: number; // Unix timestamp
}

// Transaction type from API
interface TransactionActivity extends BaseActivity {
  type: 'transaction';
  payment_id: string;
  direction: 'Sent' | 'Received';
  counterparty_address: string;
  counterparty_username?: string;
  vendor_name?: string;
  status: string;
  price_usd: number;
  computed_payment?: Array<{
    token_key: string;
    symbol: string;
    amount_to_pay: number;
    token_image_url?: string;
  }>;
}

// Deposit type from API
interface DepositActivity extends BaseActivity {
  type: 'deposit';
  id: null;
  wallet_address: string;
  token_symbol: string;
  token_image_url: string | null;
  amount_deposited_usd: number;
  amount_tokens_received: number;
}

// Union type for all activities
type Activity = TransactionActivity | DepositActivity;

interface TransactionHistoryProps {
  limit?: number;
  showTitle?: boolean;
}

export default function TransactionHistory({ limit = 10, showTitle = true }: TransactionHistoryProps) {
  const { colorScheme } = useTheme();
  const auth = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
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
      
      // Log first activity to see structure
      if (response.activities && response.activities.length > 0) {
        console.log('Sample activity structure:', JSON.stringify(response.activities[0], null, 2));
      }
      
      // Only show the requested limit
      const limitedActivities = (response.activities || []).slice(0, limit);
      setActivities(limitedActivities);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
      setError('Failed to load transaction history');
      setActivities([]);
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

  const getActivityIcon = (activity: Activity) => {
    if (activity.type === 'deposit') {
      // For deposits, check if we have a token image
      const deposit = activity as DepositActivity;
      if (deposit.token_image_url) {
        return (
          <Image 
            source={{ uri: deposit.token_image_url }}
            className="w-6 h-6 rounded-full"
            style={{ width: 24, height: 24 }}
          />
        );
      }
      // Fallback to banknote icon if no image
      return <Banknote size={20} color="#10B981" />;
    }
    
    // For transactions
    const transaction = activity as TransactionActivity;
    const isIncoming = transaction.direction === 'Received';
    const IconComponent = isIncoming ? ArrowDownLeft : ArrowUpRight;
    const color = isIncoming ? '#10B981' : '#6B7280'; // Green for received, gray for sent
    
    return <IconComponent size={20} color={color} />;
  };
  
  const getActivityTitle = (activity: Activity) => {
    if (activity.type === 'deposit') {
      return 'Deposit';
    }
    
    const transaction = activity as TransactionActivity;
    if (isPending(transaction.status)) {
      return 'Transaction Created';
    }
    return transaction.direction === 'Received' ? 'Payment Received' : 'Payment Sent';
  };
  
  const getActivityAmount = (activity: Activity) => {
    if (activity.type === 'deposit') {
      return activity.amount_deposited_usd;
    }
    return (activity as TransactionActivity).price_usd;
  };
  
  const getActivitySubtitle = (activity: Activity) => {
    if (activity.type === 'deposit') {
      return `Donated $${activity.amount_deposited_usd.toFixed(2)}`;
    }
    
    const transaction = activity as TransactionActivity;
    const prefix = isPending(transaction.status) 
      ? (transaction.direction === 'Received' ? 'Requested from' : 'Paying to')
      : (transaction.direction === 'Received' ? 'From' : 'To');
    
    // Determine the counterparty name based on transaction direction
    let counterpartyName: string;
    
    if (transaction.direction === 'Received') {
      // For received transactions, prioritize counterparty username over vendor name
      counterpartyName = transaction.counterparty_username || 
                        transaction.vendor_name || 
                        `${transaction.counterparty_address.slice(0, 8)}...`;
    } else {
      // For sent transactions, prioritize vendor name, then username
      counterpartyName = transaction.vendor_name || 
                        transaction.counterparty_username || 
                        `${transaction.counterparty_address.slice(0, 8)}...`;
    }
    
    return `${prefix} ${counterpartyName}`;
  };
  
  const getActivityPrimaryAmount = (activity: Activity) => {
    if (activity.type === 'deposit') {
      // For deposits, show tokens received (divide by 100 as per backend format)
      return (activity.amount_tokens_received / 100).toFixed(2);
    }
    // For transactions, show USD amount
    return getActivityAmount(activity).toFixed(2);
  };
  
  const getActivityPrimaryLabel = (activity: Activity) => {
    if (activity.type === 'deposit') {
      return activity.token_symbol;
    }
    return 'USD';
  };

  const formatDate = (timestamp: number) => {
    try {
      // Unix timestamp in seconds - multiply by 1000
      const date = new Date(timestamp * 1000);
      
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
          <View className="flex-1 items-center justify-center px-6 py-16">
            <View className={`w-full max-w-sm p-8 rounded-3xl ${colorScheme === 'dark' ? 'bg-gray-800/50' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View className={`w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 ${
                colorScheme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
              }`}>
                <ThemedText className="text-3xl">⚠️</ThemedText>
              </View>
              
              <ThemedText className="text-center text-2xl font-bold mb-2">Unable to Load</ThemedText>
              <ThemedText className="text-center text-base opacity-60 mb-8">{error}</ThemedText>
              
              <TouchableOpacity 
                className={`py-4 px-8 rounded-2xl items-center ${
                  colorScheme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'
                }`}
                onPress={() => loadTransactions()}
                style={{
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <ThemedText className="text-white font-semibold text-lg">Try Again</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : activities.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-16">
            <View className={`w-full max-w-sm p-8 rounded-3xl ${colorScheme === 'dark' ? 'bg-gray-800/50' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View className={`w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 ${
                colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <ThemedText className="text-3xl">💸</ThemedText>
              </View>
              
              <ThemedText className="text-center text-2xl font-bold mb-2">No Activity Yet</ThemedText>
              <ThemedText className="text-center text-base opacity-60">
                Your transaction history will appear here once you start making payments
              </ThemedText>
            </View>
          </View>
        ) : (
          <View className="px-4 pb-4">
            {activities.map((activity, index) => {
              const amount = getActivityAmount(activity);
              const isDeposit = activity.type === 'deposit';
              const isIncoming = isDeposit || (activity.type === 'transaction' && (activity as TransactionActivity).direction === 'Received');
              const isPendingActivity = activity.type === 'transaction' && isPending((activity as TransactionActivity).status);
              
              return (
                <TouchableOpacity
                  key={activity.type === 'deposit' ? `deposit-${activity.created_at}-${index}` : (activity as TransactionActivity).payment_id}
                  className={`
                    bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-3
                    ${index === 0 ? 'mt-2' : ''}
                  `}
                  onPress={() => {
                    setSelectedActivity(activity);
                    setShowDetails(true);
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="relative mr-3">
                        <View className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center">
                          {getActivityIcon(activity)}
                        </View>
                        {activity.type === 'transaction' && (
                          <View className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-50 dark:border-gray-800"
                            style={{
                              backgroundColor: isPendingActivity ? '#F59E0B' : '#10B981'
                            }}
                          />
                        )}
                      </View>
                      
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <ThemedText className="font-semibold text-base">
                            {getActivityTitle(activity)}
                          </ThemedText>
                          {activity.type === 'transaction' && (
                            <View className="ml-2">
                              {getStatusIcon((activity as TransactionActivity).status)}
                            </View>
                          )}
                        </View>
                        
                        <ThemedText className="text-sm opacity-60 mt-1">
                          {getActivitySubtitle(activity)}
                        </ThemedText>
                        
                        <ThemedText className="text-xs opacity-50 mt-1">
                          {formatDate(activity.created_at)}
                        </ThemedText>
                      </View>
                    </View>
                    
                    <View className="items-end">
                      <ThemedText className={`text-lg font-bold ${
                        isPendingActivity
                          ? 'text-gray-400'
                          : (isIncoming ? 'text-green-500' : 'text-gray-700 dark:text-gray-300')
                      }`}>
                        {isIncoming ? '+' : '-'}{getActivityPrimaryAmount(activity)} {getActivityPrimaryLabel(activity)}
                      </ThemedText>
                      
                      {activity.type === 'transaction' && (
                        <ThemedText className="text-xs opacity-50 mt-1">
                          #{(activity as TransactionActivity).payment_id}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
      
      {/* Activity Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDetails}
        onRequestClose={() => setShowDetails(false)}
      >
        <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black/50' : 'bg-black/30'}`}>
          <TouchableOpacity 
            className="flex-1 justify-center items-center px-6"
            activeOpacity={1}
            onPress={() => setShowDetails(false)}
          >
            {selectedActivity && (
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
                  onPress={() => setShowDetails(false)}
                >
                  <X size={24} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
                
                <View className={`w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 ${
                  colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Text className="text-3xl">{selectedActivity.type === 'deposit' ? '💰' : '📧'}</Text>
                </View>
                
                <Text className={`text-center text-2xl font-bold mb-2 ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {selectedActivity.type === 'deposit' ? 'Deposit Details' : 'Transaction Details'}
                </Text>
                
                {/* Activity Info */}
                <View className="space-y-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center mr-3">
                      {getActivityIcon(selectedActivity)}
                    </View>
                    <View>
                      <ThemedText className={`text-2xl font-bold ${
                        selectedActivity.type === 'transaction' && isPending((selectedActivity as TransactionActivity).status)
                          ? 'text-gray-400'
                          : ((selectedActivity.type === 'deposit' || (selectedActivity.type === 'transaction' && (selectedActivity as TransactionActivity).direction === 'Received')) ? 'text-green-500' : 'text-gray-700 dark:text-gray-300')
                      }`}>
                        {selectedActivity.type === 'deposit' || (selectedActivity.type === 'transaction' && (selectedActivity as TransactionActivity).direction === 'Received') ? '+' : '-'}{getActivityPrimaryAmount(selectedActivity)} {getActivityPrimaryLabel(selectedActivity)}
                      </ThemedText>
                      <ThemedText className="text-sm opacity-60">
                        {selectedActivity.type === 'deposit' ? 'Deposit' : (selectedActivity as TransactionActivity).direction}
                      </ThemedText>
                    </View>
                  </View>
                  {selectedActivity.type === 'transaction' && (
                    <View className="items-center">
                      {getStatusIcon((selectedActivity as TransactionActivity).status)}
                      <ThemedText className="text-xs mt-1 capitalize">
                        {(selectedActivity as TransactionActivity).status}
                      </ThemedText>
                    </View>
                  )}
                </View>
                
                <View className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  {selectedActivity.type === 'deposit' ? (
                    // Deposit Details
                    <>
                      <View className="mb-3">
                        <ThemedText className="text-sm opacity-60 mb-1">Donation Amount</ThemedText>
                        <ThemedText className="text-lg font-bold">
                          ${(selectedActivity as DepositActivity).amount_deposited_usd.toFixed(2)} USD
                        </ThemedText>
                      </View>
                      
                      <View className="mb-3">
                        <ThemedText className="text-sm opacity-60 mb-1">Tokens Received</ThemedText>
                        <View className="flex-row items-center">
                          {(selectedActivity as DepositActivity).token_image_url && (
                            <Image 
                              source={{ uri: (selectedActivity as DepositActivity).token_image_url || '' }}
                              className="w-8 h-8 rounded-full mr-2"
                              style={{ width: 32, height: 32 }}
                            />
                          )}
                          <ThemedText className="text-lg font-bold">
                            {((selectedActivity as DepositActivity).amount_tokens_received / 100).toFixed(2)} {(selectedActivity as DepositActivity).token_symbol}
                          </ThemedText>
                        </View>
                      </View>
                      
                      <View className="mb-3">
                        <ThemedText className="text-sm opacity-60 mb-1">Wallet Address</ThemedText>
                        <ThemedText className="font-mono text-xs">
                          {(selectedActivity as DepositActivity).wallet_address}
                        </ThemedText>
                      </View>
                    </>
                  ) : (
                    // Transaction Details
                    <>
                      <View className="mb-3">
                        <ThemedText className="text-sm opacity-60 mb-1">Payment ID</ThemedText>
                        <ThemedText className="font-mono text-sm">{(selectedActivity as TransactionActivity).payment_id}</ThemedText>
                      </View>
                      
                      <View className="mb-3">
                        <ThemedText className="text-sm opacity-60 mb-1">
                          {(() => {
                            const transaction = selectedActivity as TransactionActivity;
                            const isIncoming = transaction.direction === 'Received';
                            if (isPending(transaction.status)) {
                              return isIncoming ? 'Requested from' : 'Paying to';
                            } else {
                              return isIncoming ? 'From' : 'To';
                            }
                          })()}
                        </ThemedText>
                        <ThemedText className="text-sm">
                          {(() => {
                            const transaction = selectedActivity as TransactionActivity;
                            if (transaction.direction === 'Received') {
                              return transaction.counterparty_username || 
                                     transaction.vendor_name || 
                                     transaction.counterparty_address;
                            } else {
                              return transaction.vendor_name || 
                                     transaction.counterparty_username || 
                                     transaction.counterparty_address;
                            }
                          })()}
                        </ThemedText>
                      </View>
                      
                      <View className="mb-3">
                        <ThemedText className="text-sm opacity-60 mb-1">Amount (USD)</ThemedText>
                        <ThemedText className="text-lg font-bold">
                          ${(selectedActivity as TransactionActivity).price_usd.toFixed(2)}
                        </ThemedText>
                      </View>
                    </>
                  )}
                  
                  <View className="mb-3">
                    <ThemedText className="text-sm opacity-60 mb-1">Date</ThemedText>
                    <ThemedText className="text-sm">
                      {new Date(selectedActivity.created_at * 1000).toLocaleString()}
                    </ThemedText>
                  </View>
                  
                  {/* Token Details for Transactions */}
                  {selectedActivity.type === 'transaction' && (selectedActivity as TransactionActivity).computed_payment && (selectedActivity as TransactionActivity).computed_payment!.length > 0 && (
                    <View className="mt-4">
                      <ThemedText className="text-sm opacity-60 mb-2">Token Breakdown</ThemedText>
                      
                      {(selectedActivity as TransactionActivity).computed_payment!.map((payment, index) => {
                        const [tokenAddress] = payment.token_key.split(',');
                        // Calculate USD value proportionally
                        const totalAmount = (selectedActivity as TransactionActivity).computed_payment!.reduce(
                          (sum, p) => sum + p.amount_to_pay, 0
                        );
                        const proportion = totalAmount > 0 ? (payment.amount_to_pay / totalAmount) : 0;
                        const usdValue = (selectedActivity as TransactionActivity).price_usd * proportion;
                        
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
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </ThemedView>
  );
}