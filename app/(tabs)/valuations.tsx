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
import { fetchTokenValuations, updateTokenValuation as updateTokenValuationApi, TokenValuation } from '@/services/valuationService';

// Constants for slider configuration
const { width } = Dimensions.get('window');
const visibleRange = 40; // Number of visible segments
const segmentWidth = 1; // Width of each tick mark
const segmentSpacing = 13; // Space between tick marks
const snapSegment = segmentWidth + segmentSpacing; // Total width of one segment
const spacerWidth = (width - segmentWidth) / 2; // Space at beginning and end
const totalWidth = spacerWidth * 2 + visibleRange * snapSegment; // Total ruler width
const indicatorWidth = 3; // Width of the position indicator

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

// CircularRuler component that creates the illusion of infinite scrolling
const CircularRuler = ({ currentValue, onValueChange }: { currentValue: number; onValueChange: (value: number) => void }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [value, setValue] = useState(currentValue);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const lastScrollPosition = useRef(0);
  const accumulatedOffset = useRef(currentValue);
  const { colorScheme } = useTheme();
  
  // Calculate center position
  const centerPosition = visibleRange / 2;
  
  // Generate visible ticks centered around current value
  const generateTicks = (centerValue: number) => {
    const halfRange = Math.floor(visibleRange / 2);
    const start = centerValue - halfRange;
    return Array.from({ length: visibleRange }, (_, i) => i + start);
  };
  

  // Helper function to ensure the ruler is centered
  const centerRuler = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: centerPosition * snapSegment,
        animated: false
      });
    }
  };
  
  const [ticks, setTicks] = useState(() => generateTicks(value));
  
  // Handle scroll events
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const position = event.nativeEvent.contentOffset.x;
    lastScrollPosition.current = position;
    
    // Calculate current tick index
    const rawTickIndex = position / snapSegment;
    const tickIndex = Math.round(rawTickIndex);
    
    // Calculate the adjusted value based on offset from center
    const newValue = ticks[tickIndex];
    
    if (newValue !== undefined && newValue !== value) {
      setValue(newValue);
      // Ensure we're passing the value to the parent component
      onValueChange(newValue);
    }
  };
  
  // Check if we need to reset scroll position
  const handleScrollEnd = () => {
    setIsScrolling(false);
    
    // If we're near the edges, reset to center
    const tickIndex = Math.round(lastScrollPosition.current / snapSegment);
    
    if (tickIndex < 5 || tickIndex > visibleRange - 6) {
      // Remember the current value
      accumulatedOffset.current = value;
      
      // Generate new ticks centered on current value
      setTicks(generateTicks(value));
      
      // Reset scroll position to center (with animation turned off)
      centerRuler();
    }
  };
  
  // Initial scroll to position when ticks change
  useEffect(() => {
    if (!isScrolling) {
      centerRuler();
    }
  }, [ticks]);
  
  // Ensure values are centered when component mounts
  useEffect(() => {
    // Center the ruler on initial load with a slight delay to ensure rendering is complete
    setTimeout(centerRuler, 100);
  }, []);
  
  useEffect(() => {
    // Only update when currentValue changes and it's not the initial render
    if (currentValue !== value) {
      setTicks(generateTicks(currentValue));
      setValue(currentValue);
      // Ensure we center the ruler after a brief delay to allow rendering
      setTimeout(centerRuler, 50);
    }
  }, [currentValue]);

  return (
    <View style={styles.rulerContainer}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        contentContainerStyle={styles.scrollViewContainerStyle}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        snapToInterval={snapSegment}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { 
            useNativeDriver: true,
            listener: handleScroll
          }
        )}
        onScrollBeginDrag={() => setIsScrolling(true)}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
      >
        <View style={styles.ruler}>
          <View style={styles.spacer} />
          {ticks.map((tickValue, i) => {
            const isMajor = tickValue % 5 === 0; // Major tick marks at multiples of 5
            const isCenter = tickValue === 0; // Center (no adjustment) position
            
            return (
              <View key={i} style={styles.tickContainer}>
                <View
                  style={[
                    styles.segment,
                    {
                      backgroundColor: isCenter ? (colorScheme === 'dark' ? '#FFFFFF' : '#000000') : 
                                       (tickValue > 0 ? '#F2C464' : '#68D6E4'),
                      height: isCenter ? 22 : (isMajor ? 14 : 6),
                      marginRight: i === ticks.length - 1 ? 0 : segmentSpacing
                    }
                  ]}
                />
                {isMajor && (
                  <Text style={[
                    styles.tickLabel, 
                    { color: isCenter ? (colorScheme === 'dark' ? '#FFFFFF' : '#000000') : 
                              (tickValue > 0 ? '#F7DC6F' : '#87CEEB') }
                  ]}>
                    {Math.abs(tickValue)}
                  </Text>
                )}
              </View>
            );
          })}
          <View style={styles.spacer} />
        </View>
      </Animated.ScrollView>
      
      {/* Center indicator line */}
      <View style={styles.indicatorWrapper}>
        <View style={styles.indicatorLine} />
      </View>
    </View>
  );
}

const PremiumDiscountSlider = ({ token, onUpdateValuation }: { token: Token; onUpdateValuation: (symbol: string, newAdjustment: number) => Promise<void> }) => {
  // Current token adjustment value
  const [adjustment, setAdjustment] = useState(token.adjustment || 0);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Update adjustment when token changes
  useEffect(() => {
    setAdjustment(token.adjustment || 0);
  }, [token.adjustment]);
  
  // Handle value changes from the slider
  const handleValueChange = async (newValue: number) => {
    if (newValue !== adjustment) {
      setAdjustment(newValue);
      setIsUpdating(true);
      try {
        await onUpdateValuation(token.symbol, newValue);
      } catch (error) {
        console.error('Error updating valuation:', error);
        // Revert to previous value on error
        setAdjustment(token.adjustment);
        Alert.alert('Update Failed', 'Failed to update valuation. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }
  };
  
  return (
    <View style={styles.sliderContainer}>
      {/* Premium/Discount Labels */}
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>Discount</Text>
        <Text style={styles.labelText}>Premium</Text>
      </View>
      
      {/* Circular scrolling ruler */}
      <CircularRuler 
        currentValue={adjustment} 
        onValueChange={handleValueChange}
      />
      
      {isUpdating && (
        <View style={styles.updatingIndicator}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
    </View>
  );
}

const Valuations = ({ tokens, onUpdateValuation, isLoading, onRefresh }: ValuationsProps) => {
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);
  
  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading valuations...</Text>
      </View>
    );
  }
  
  if (tokens.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tokens found</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={onRefresh}
        >
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Token Valuations</Text>
        <Text style={styles.headerSubtitle}>Adjust premium or discount for each token</Text>
      </View>
      
      {tokens.map((token) => (
        <TokenRow 
          key={token.symbol || token.name} 
          token={token} 
          onUpdateValuation={onUpdateValuation} 
        />
      ))}
    </ScrollView>
  );
}

const TokenRow = ({ token, onUpdateValuation }: { token: Token; onUpdateValuation: (symbol: string, newAdjustment: number) => Promise<void> }) => {
  const { colorScheme } = useTheme();
  
  return (
    <View style={styles.tokenRow}>
      <View style={styles.tokenInfoContainer}>
        <View style={styles.tokenIconContainer}>
          {token.iconUrl ? (
            <Image 
              source={{ uri: token.iconUrl }} 
              style={styles.tokenIcon} 
            />
          ) : (
            <View style={[styles.tokenIconPlaceholder, { backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }]}>
              <Text style={[styles.tokenIconText, { color: colorScheme === 'dark' ? '#F9FAFB' : '#1F2937' }]}>
                {token.symbol.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.tokenDetails}>
          <Text style={[styles.tokenName, { color: colorScheme === 'dark' ? '#F9FAFB' : '#1F2937' }]}>
            {token.name}
          </Text>
          <View style={styles.tokenMetaContainer}>
            <Text style={[styles.tokenSymbol, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
              {token.symbol}
            </Text>
            <View 
              style={[
                styles.valuationBadge, 
                { backgroundColor: token.has_set 
                  ? colorScheme === 'dark' ? '#1E3A8A' : '#DBEAFE' 
                  : colorScheme === 'dark' ? '#374151' : '#F3F4F6' 
                }
              ]}
            >
              <Text 
                style={[
                  styles.valuationBadgeText, 
                  { color: token.has_set 
                    ? colorScheme === 'dark' ? '#BFDBFE' : '#1E40AF' 
                    : colorScheme === 'dark' ? '#D1D5DB' : '#4B5563' 
                  }
                ]}
              >
                {token.has_set ? 'Custom' : 'Default'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.tokenValueContainer}>
          <Text style={[styles.tokenTotalValue, { color: colorScheme === 'dark' ? '#F9FAFB' : '#1F2937' }]}>
            ${(parseFloat(token.amount) * token.value).toFixed(2)}
          </Text>
          <Text style={[styles.tokenUnitValue, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
            {token.amount} @ ${token.value.toFixed(2)}
          </Text>
          {token.adjustment !== 0 && (
            <Text 
              style={[
                styles.adjustmentText, 
                { color: token.adjustment > 0 
                  ? colorScheme === 'dark' ? '#86EFAC' : '#22C55E' 
                  : colorScheme === 'dark' ? '#FCA5A5' : '#EF4444' 
                }
              ]}
            >
              {token.adjustment > 0 ? '+' : ''}{token.adjustment.toFixed(2)} valuation adjustment
            </Text>
          )}
        </View>
      </View>
      
      {/* Only show slider for non-USD tokens */}
      {token.symbol !== 'USD' && (
        <PremiumDiscountSlider
          token={token}
          onUpdateValuation={onUpdateValuation}
        />
      )}
    </View>
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
        // Handle both formats - the expected TokenValuation format and the adapted format
        const tokenName = valuation.token_name;
        const tokenSymbol = valuation.token_symbol || tokenName.toUpperCase();
        const value = typeof valuation.current_valuation === 'number' 
          ? valuation.current_valuation 
          : parseFloat(valuation.current_valuation || '0');
        
        return {
          name: tokenName,
          symbol: tokenSymbol,
          amount: '10', // This would come from another API endpoint in a real app
          value: value,
          adjustment: 0, // This would be calculated based on the default vs. custom valuation
          change: 0, // This would come from another API endpoint in a real app
          has_set: valuation.has_set || false,
          iconUrl: getTokenIconUrl(tokenSymbol)
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
      console.log(`Calling API with token name: ${token.name}, value: ${newAdjustment}`);
      const result = await updateTokenValuationApi(walletAddress, token.name, newAdjustment);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }}>
        <View style={styles.errorContainer}>
          <Text style={{ color: '#EF4444', fontSize: 16, marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadTokenValuations}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }}>
      <Valuations 
        tokens={tokens}
        onUpdateValuation={updateTokenValuation}
        isLoading={isLoading}
        onRefresh={loadTokenValuations}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 40,
  },
  sliderContainer: {
    height: 80,
    width: '100%',
    position: 'relative',
  },
  updatingIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  currentValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  currentValueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  rulerContainer: {
    height: 50,
    width: '100%',
    position: 'relative',
  },
  ruler: {
    width: totalWidth,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  tickContainer: {
    alignItems: 'center',
    marginHorizontal: segmentSpacing / 2,
  },
  segment: {
    width: segmentWidth,
  },
  tickLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  scrollViewContainerStyle: {
    justifyContent: 'flex-end',
  },
  indicatorWrapper: {
    position: 'absolute',
    left: width / 2 - (indicatorWidth / 2),
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: indicatorWidth,
  },
  indicatorLine: {
    width: 3,
    height: 50,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  centerText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  spacer: {
    width: spacerWidth,
  },
  usdText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  tokenRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  tokenInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenIconContainer: {
    marginRight: 12,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tokenMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenSymbol: {
    fontSize: 14,
  },
  valuationBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  valuationBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tokenValueContainer: {
    alignItems: 'flex-end',
  },
  tokenTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tokenUnitValue: {
    fontSize: 14,
  },
  adjustmentText: {
    fontSize: 12,
    marginTop: 4,
  },
  headerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});