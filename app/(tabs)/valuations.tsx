import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  View,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { fetchTokenValuations, updateTokenValuation as updateTokenValuationApi, TokenValuation } from '@/services/valuationService';
import ValuationEditor from '@/components/ValuationEditor';
import { Edit3, TrendingUp, TrendingDown } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Token type definition
interface Token {
  name: string;
  symbol: string;
  amount: string;
  value: number;
  adjustment: number; // Dollar amount adjustment (positive for premium, negative for discount)
  change: number;
  iconUrl?: string;
  has_set: boolean; // Whether the valuation was set by the user or is default
  isUpdating?: boolean; // Whether the token valuation is currently being updated
}

interface ValuationsProps {
  tokens: Token[];
  onUpdateValuation: (symbol: string, newAdjustment: number) => Promise<void>;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

// Component to display token valuation bar
const TokenValuationBar = ({ adjustment, colorScheme }: { adjustment: number; colorScheme: 'light' | 'dark' }) => {
  const isDark = colorScheme === 'dark';
  // Dynamic max based on actual values
  const maxAdjustment = Math.max(50, Math.ceil(Math.abs(adjustment) / 50) * 50);
  const percentage = Math.min(Math.abs(adjustment) / maxAdjustment, 1) * 50; // Max 50% of bar
  const isPositive = adjustment > 0;
  const isExtreme = Math.abs(adjustment) > 100; // Show indicator for extreme values
  
  return (
    <View className="w-full h-2 relative">
      {/* Background track */}
      <View className={`absolute inset-0 rounded-full ${
        isDark ? 'bg-gray-700' : 'bg-gray-200'
      }`} />
      
      {/* Center marker */}
      <View className={`absolute top-0 bottom-0 w-0.5 left-1/2 -translate-x-0.5 ${
        isDark ? 'bg-gray-600' : 'bg-gray-300'
      }`} />
      
      {/* Colored fill */}
      {adjustment !== 0 && (
        <View
          className={`absolute top-0 bottom-0 rounded-full ${
            isPositive ? 'bg-green-500' : 'bg-yellow-500'
          }`}
          style={{
            width: `${percentage}%`,
            [isPositive ? 'left' : 'right']: '50%',
          }}
        />
      )}
      
      {/* Value indicator dot */}
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
      
      {/* Extreme value indicator */}
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
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);
  
  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
        <ThemedText className="mt-4 text-base opacity-60">Loading valuations...</ThemedText>
      </View>
    );
  }
  
  if (tokens.length === 0 && !isLoading) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className={`w-full max-w-sm p-8 rounded-3xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className={`w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <ThemedText className="text-3xl">🪙</ThemedText>
          </View>
          
          <ThemedText className="text-center text-2xl font-bold mb-2">No Valuations Yet</ThemedText>
          <ThemedText className="text-center text-base opacity-60 mb-8">
            Start by setting your personal valuations for tokens in your wallet
          </ThemedText>
          
          <TouchableOpacity 
            className={`py-4 px-8 rounded-2xl items-center ${
              isDark ? 'bg-blue-600' : 'bg-blue-500'
            }`}
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
    <ScrollView 
      className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={isDark ? '#60A5FA' : '#3B82F6'}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-4 pb-2">
        <ThemedText className="text-3xl font-bold mb-2">Valuations</ThemedText>
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
            <ThemedText className="text-sm opacity-60">Discount</ThemedText>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5" />
            <ThemedText className="text-sm opacity-60">Premium</ThemedText>
          </View>
        </View>
      </View>
      
      <View className="pb-4">
        {tokens.map((token) => (
          <TokenRow 
            key={token.symbol || token.name} 
            token={token} 
            onEditToken={onEditToken}
          />
        ))}
      </View>
      
      <View className="h-20" />
    </ScrollView>
  );
}

const TokenRow = ({ token, onEditToken }: { token: Token; onEditToken: (token: Token) => void }) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <TouchableOpacity
      onPress={() => onEditToken(token)}
      disabled={token.symbol === 'USD'}
      className={`mx-4 mb-3 ${isDark ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl overflow-hidden`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.08,
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
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                  }}
                />
              ) : (
                <View className={`w-12 h-12 rounded-full items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
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
          
          {token.adjustment !== 0 && (
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
        
        {/* Valuation bar for non-USD tokens */}
        {token.symbol !== 'USD' && (
          <View className="mt-2">
            <TokenValuationBar adjustment={token.adjustment} colorScheme={colorScheme} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Screen component

// Initial mock data
const mockTokens = [

  {
    name: 'Tree',
    symbol: 'TREE',
    amount: '30',
    value: 40.55,
    adjustment: 0,  // $4 premium as shown in the image
    change: 0,
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/189/189503.png',
  },
  {
    name: 'Fountain',
    symbol: 'FOUNTAIN',
    amount: '5',
    value: 8.37,
    adjustment: 0,  // $4 premium as shown in the image
    change: 0,
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3464/3464446.png',
  },
  {
    name: 'River Cleanup',
    symbol: 'RIVER',
    amount: '1',
    value: 1.09,
    adjustment: 0,
    change: 0,
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/119/119573.png',
  },
  {
    name: 'Solar Panel',
    symbol: 'SOLAR',
    amount: '12',
    value: 18.75,
    adjustment: 0,  // $2 discount
    change: 0,
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/196/196695.png',
  },
  {
    name: 'Wind Farm',
    symbol: 'WIND',
    amount: '3',
    value: 6.50,
    adjustment: 0,  // $1 premium
    change: 0,
    iconUrl: 'https://cdn1.iconfinder.com/data/icons/environment-and-ecology-icons/137/Ecology_24-18-512.png',
  },
  {
    name: 'Ocean Cleanup',
    symbol: 'OCEAN',
    amount: '15',
    value: 22.50,
    adjustment: 0,  // $3 discount
    change: 0,
    iconUrl: 'https://cdn4.iconfinder.com/data/icons/marine-3/64/C_Sea-512.png',
  },
];

export default function ValuationsScreen() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { walletAddress } = useAuth();
  const { colorScheme } = useTheme();
  
  // Load token valuations when the component mounts
  useEffect(() => {
    loadTokenValuations();
  }, []);
  
  // Function to load token valuations from the API
  const loadTokenValuations = async () => {
    if (!walletAddress) {
      console.log('No wallet address found');
      setError('No wallet address found');
      setIsLoading(false);
      return;
    }
    
    console.log('Loading valuations for wallet:', walletAddress);
    
    try {
      setIsLoading(true);
      
      // This will either return an array of valuations or an adapted array from the object format
      const valuations = await fetchTokenValuations(walletAddress);
      
      console.log('API Response after processing:', JSON.stringify(valuations, null, 2));
      
      if (!valuations || valuations.length === 0) {
        console.log('No valuations returned from API');
        setError('No token valuations found');
        setTokens([]);
        return;
      }
      
      // Transform the API response to match our Token interface
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
          value: 0, // Not used
          adjustment: adjustment, // The valuation from API is the adjustment itself
          change: 0,
          has_set: valuation.has_set || false,
          iconUrl: valuation.token_image_url || getTokenIconUrl(tokenSymbol)
        };
      });
      
      console.log('Transformed tokens:', JSON.stringify(transformedTokens, null, 2));
      setTokens(transformedTokens);
      setError(null);
    } catch (err: any) {
      console.error('Error loading token valuations:', err);
      console.error('Error details:', err.message);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', JSON.stringify(err.response.data, null, 2));
      }
      
      setError(`API Error: ${err.message}`);
      setTokens([]); // Don't fall back to mock tokens so we can see the real error
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to update a token's valuation
  const updateTokenValuation = async (symbol: string, newAdjustment: number): Promise<void> => {
    if (!walletAddress) {
      Alert.alert('Error', 'No wallet address found');
      return;
    }
    
    console.log(`Updating valuation for ${symbol} to ${newAdjustment} for wallet ${walletAddress}`);
    
    try {
      // Update the local state optimistically
      setTokens(prevTokens => 
        prevTokens.map(token => {
          if (token.symbol === symbol) {
            // Don't allow changing USD valuation
            if (symbol === 'USD') return token;
            
            return {
              ...token,
              adjustment: newAdjustment,
              has_set: true // Mark as custom valuation
            };
          }
          return token;
        })
      );
      
      // Find the token name from the symbol
      const token = tokens.find(t => t.symbol === symbol);
      if (!token) {
        console.error(`Token with symbol ${symbol} not found`);
        Alert.alert('Error', `Token with symbol ${symbol} not found`);
        return;
      }
      
      // Call the API to update the valuation
      console.log(`Calling API with token symbol: ${symbol}, value: ${newAdjustment}`);
      const result = await updateTokenValuationApi(walletAddress, symbol, newAdjustment);
      console.log(`API response:`, result);
      console.log(`Successfully updated valuation for ${symbol} to ${newAdjustment}`);
    } catch (err: any) {
      console.error('Error updating token valuation:', err);
      console.error('Error details:', err.message);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', JSON.stringify(err.response.data, null, 2));
      }
      
      Alert.alert('Error', `Failed to update valuation: ${err.message}`);
      // Revert the optimistic update on error
      loadTokenValuations();
      throw err; // Re-throw to be handled by the caller
    }
  };
  
  // Handle token edit
  const handleEditToken = (token: Token) => {
    setSelectedToken(token);
    setShowEditor(true);
  };
  
  // Handle save from editor
  const handleSaveValuation = async (symbol: string, adjustment: number) => {
    await updateTokenValuation(symbol, adjustment);
  };
  
  // Helper function to get a token icon URL (in a real app, this would be provided by the API)
  const getTokenIconUrl = (symbol: string): string => {
    const iconMap: Record<string, string> = {
      'TREE': 'https://cdn-icons-png.flaticon.com/512/189/189503.png',
      'FOUNTAIN': 'https://cdn-icons-png.flaticon.com/512/3464/3464446.png',
      'RIVER': 'https://cdn-icons-png.flaticon.com/512/119/119573.png',
      'SOLAR': 'https://cdn-icons-png.flaticon.com/512/196/196695.png',
      'WIND': 'https://cdn1.iconfinder.com/data/icons/environment-and-ecology-icons/137/Ecology_24-18-512.png',
      'OCEAN': 'https://cdn4.iconfinder.com/data/icons/marine-3/64/C_Sea-512.png',
    };
    
    return iconMap[symbol] || '';
  };
  
  // If there's an error, show an error message
  if (error) {
    return (
      <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
        <View className="flex-1 items-center justify-center px-6">
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
            
            <ThemedText className="text-center text-2xl font-bold mb-2">Connection Error</ThemedText>
            <ThemedText className="text-center text-base opacity-60 mb-8">{error}</ThemedText>
            
            <TouchableOpacity 
              className={`py-4 px-8 rounded-2xl items-center ${
                colorScheme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'
              }`}
              onPress={loadTokenValuations}
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Text className="text-white font-semibold text-lg">Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <Valuations 
        tokens={tokens}
        onUpdateValuation={updateTokenValuation}
        isLoading={isLoading}
        onRefresh={loadTokenValuations}
        onEditToken={handleEditToken}
      />
      <ValuationEditor
        visible={showEditor}
        token={selectedToken}
        onClose={() => {
          setShowEditor(false);
          setSelectedToken(null);
        }}
        onSave={handleSaveValuation}
      />
    </SafeAreaView>
  );
}

