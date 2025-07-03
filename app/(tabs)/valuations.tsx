import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { ThemedView } from '@/components/core/ThemedView';
import { ThemedText } from '@/components/core/ThemedText';
import { fetchTokenValuations, updateTokenValuation as updateTokenValuationApi } from '@/services/valuationService';
import ValuationEditor from '@/components/valuation/ValuationEditor';
import ErrorModal from '@/components/modals/ErrorModal';


// Token type definition
interface Token {
  name: string;
  symbol: string;
  amount: string;
  value: number;
  adjustment: number;
  change: number;
  iconUrl?: string;
  has_set: boolean;
  isUpdating?: boolean;
}

interface ValuationsProps {
  tokens: Token[];
  onUpdateValuation: (symbol: string, newAdjustment: number) => Promise<void>;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

const TokenValuationBar = ({ adjustment }: { adjustment: number }) => {
  const maxAdjustment = Math.max(50, Math.ceil(Math.abs(adjustment) / 50) * 50);
  const percentage = Math.min(Math.abs(adjustment) / maxAdjustment, 1) * 50;
  const isPositive = adjustment > 0;
  const isExtreme = Math.abs(adjustment) > 100;
  
  return (
    <View className="w-full h-2 relative">
      <View className="absolute inset-0 rounded-full bg-gray-200" />
      <View className="absolute top-0 bottom-0 w-0.5 left-1/2 -translate-x-0.5 bg-gray-300" />
      {adjustment !== 0 && (
        <View
          className={`absolute top-0 bottom-0 rounded-full ${
            isPositive ? 'bg-green-500' : 'bg-yellow-500'
          }`}
          style={{
            left: isPositive ? '50%' : `${50 - percentage}%`,
            width: `${percentage}%`,
          }}
        />
      )}
      
      <View
        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white ${
          adjustment === 0 ? 'bg-gray-400' : (isPositive ? 'bg-green-500' : 'bg-yellow-500')
        }`}
        style={{
          left: `${50 + (adjustment / maxAdjustment * 50)}%`,
          transform: [{ translateX: -8 }, { translateY: -8 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 3,
        }}
      />
      
      {isExtreme && (
        <View className={`absolute -top-2 ${isPositive ? 'right-0' : 'left-0'}`}>
          <View className={`w-1 h-1 rounded-full ${isPositive ? 'bg-green-500' : 'bg-yellow-500'}`} />
        </View>
      )}
    </View>
  );
}

const Valuations = ({ tokens, onUpdateValuation, isLoading, onRefresh, onEditToken }: ValuationsProps & { onEditToken: (token: Token) => void }) => {
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);
  
  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <ThemedText className="mt-4 text-base opacity-60">Loading valuations...</ThemedText>
      </View>
    );
  }
  
  if (tokens.length === 0 && !isLoading) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-sm p-8 rounded-3xl bg-white"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className="w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 bg-gray-100">
            <ThemedText className="text-3xl">🪙</ThemedText>
          </View>
          
          <ThemedText className="text-center text-2xl font-bold mb-2">No Valuations Yet</ThemedText>
          <ThemedText className="text-center text-base opacity-60 mb-8">
            Start by setting your personal valuations for tokens in your wallet
          </ThemedText>
          
          <TouchableOpacity 
            className="py-4 px-8 rounded-2xl items-center bg-blue-500"
            onPress={onRefresh}
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text className="text-white font-semibold text-lg">Refresh Tokens</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View className="flex-1">
      <View className="pt-20 pb-5 px-5">
        <Text className="text-3xl font-bold text-black">Preferences</Text>
        
        <ThemedText className="text-base opacity-60 my-4">
         Select the cause you want to create a preference for. Adjusting this value changes the amount of discounts or premiums users get for paying in these cause tokens. 
        </ThemedText>
        <View className="flex-row items-center gap-6 mt-4">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
            <ThemedText className="text-base font-medium">Premium</ThemedText>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
            <ThemedText className="text-base font-medium">Discount</ThemedText>
          </View>
        </View>
      </View>
      
      <ScrollView 
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="pb-4">
          {tokens.map((token) => (
            <TokenRow 
              key={token.symbol || token.name} 
              token={token} 
              onEditToken={onEditToken}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const TokenRow = ({ token, onEditToken }: { token: Token; onEditToken: (token: Token) => void }) => {
  
  return (
    <TouchableOpacity
      onPress={() => onEditToken(token)}
      disabled={token.symbol === 'USD'}
      className={`mx-4 mb-3 bg-white rounded-2xl overflow-hidden ${token.symbol === 'USD' ? 'opacity-90' : ''}`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View className="relative">
              {token.iconUrl ? (
                <Image 
                  source={{ uri: token.iconUrl }} 
                  className="w-12 h-12 rounded-full"
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.05)'
                  }}
                />
              ) : (
                <View className="w-12 h-12 rounded-full items-center justify-center bg-gray-100">
                  <ThemedText className="text-lg font-bold">
                    {token.symbol.charAt(0)}
                  </ThemedText>
                </View>
              )}
            </View>
            
            <View className="ml-3 flex-1">
              <ThemedText className="text-base font-semibold">
                {token.name}
              </ThemedText>
              <ThemedText className="text-sm opacity-60">
                {token.symbol}
              </ThemedText>
            </View>
          </View>
          
          {token.symbol === 'USD' ? (
            <View className="items-end">
              <View className="px-3 py-1 rounded-full bg-gray-200">
                <ThemedText className="text-sm font-medium opacity-60">
                  1:1
                </ThemedText>
              </View>
            </View>
          ) : token.adjustment !== 0 && (
            <View className="items-end">
              <ThemedText className={`text-lg font-bold ${
                token.adjustment > 0 ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {token.adjustment > 0 ? '+' : ''}{token.adjustment < 0 ? '-' : ''}${Math.abs(token.adjustment).toFixed(2)}
              </ThemedText>
              <ThemedText className="text-xs opacity-50">
                {token.adjustment > 0 ? 'Discount' : 'Premium'}
              </ThemedText>
            </View>
          )}
        </View>
        
        {token.symbol !== 'USD' && (
          <View className="mt-2">
            <TokenValuationBar adjustment={token.adjustment} />
          </View>
        )}
        
        {token.symbol === 'USD' && (
          <View className="mt-2">
            <View className="h-2 rounded-full bg-gray-200">
              <View className="h-full w-full rounded-full bg-gray-300" />
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}


export default function ValuationsScreen() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { walletAddress } = useAuth();
  
  useEffect(() => {
    loadTokenValuations();
  }, []);
  
  const loadTokenValuations = async () => {
    if (!walletAddress) {
      setError('No wallet address found');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const valuations = await fetchTokenValuations(walletAddress);
      
      if (!valuations || valuations.length === 0) {
        setError('No token valuations found');
        setTokens([]);
        return;
      }
      
      const transformedTokens: Token[] = valuations.map(valuation => {
        const tokenName = valuation.token_name;
        const tokenSymbol = valuation.token_symbol || tokenName.toUpperCase();
        const adjustment = typeof valuation.current_valuation === 'number' 
          ? valuation.current_valuation 
          : parseFloat(valuation.current_valuation || '0');
        
        return {
          name: tokenName,
          symbol: tokenSymbol,
          amount: '10',
          value: 0,
          adjustment: adjustment,
          change: 0,
          has_set: valuation.has_set || false,
          iconUrl: valuation.token_image_url || '' 
        };
      });
      
      const sortedTokens = transformedTokens.sort((a, b) => {
        if (a.symbol === 'USD') return -1;
        if (b.symbol === 'USD') return 1;
        return a.name.localeCompare(b.name);
      });
      
      setTokens(sortedTokens);
      setError(null);
    } catch (err: any) {
      setError(`API Error: ${err.message}`);
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateTokenValuation = async (symbol: string, newAdjustment: number): Promise<void> => {
    if (!walletAddress) {
      Alert.alert('Error', 'No wallet address found');
      return;
    }
    
    try {
      setTokens(prevTokens => 
        prevTokens.map(token => {
          if (token.symbol === symbol) {
            if (symbol === 'USD') return token;
            
            return {
              ...token,
              adjustment: newAdjustment,
              has_set: true
            };
          }
          return token;
        })
      );
      
      const token = tokens.find(t => t.symbol === symbol);
      if (!token) {
        Alert.alert('Error', `Token with symbol ${symbol} not found`);
        return;
      }
      
      await updateTokenValuationApi(walletAddress, symbol, newAdjustment);
    } catch (err: any) {
      Alert.alert('Error', `Failed to update valuation: ${err.message}`);
      loadTokenValuations();
      throw err;
    }
  };
  
  const handleEditToken = (token: Token) => {
    setSelectedToken(token);
    setShowEditor(true);
  };
  
  const handleSaveValuation = async (symbol: string, adjustment: number) => {
    await updateTokenValuation(symbol, adjustment);
  };
  
  if (error) {
    return (
      <>
        <ThemedView className="flex-1" />
        <ErrorModal
          visible={true}
          onClose={() => setError(null)}
          onRetry={loadTokenValuations}
          message={error}
        />
      </>
    );
  }
  
  return (
    <>
      <ThemedView className="flex-1">
        <Valuations 
          tokens={tokens}
          onUpdateValuation={updateTokenValuation}
          isLoading={isLoading}
          onRefresh={loadTokenValuations}
          onEditToken={handleEditToken}
        />
      </ThemedView>
      <ValuationEditor
        visible={showEditor}
        token={selectedToken}
        onClose={() => {
          setShowEditor(false);
          setSelectedToken(null);
        }}
        onSave={handleSaveValuation}
      />
    </>
  );
}

