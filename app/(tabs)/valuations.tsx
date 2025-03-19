import React, { useRef, useEffect, useState } from 'react';
import {
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  View,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';

// Constants for slider configuration
const { width } = Dimensions.get('screen');
const visibleRange = 40; // Number of visible segments
const segmentWidth = 2; // Width of each tick mark
const segmentSpacing = 15; // Space between tick marks
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
}

interface ValuationsProps {
  tokens: Token[];
  onUpdateValuation: (symbol: string, newAdjustment: number) => void;
}

// CircularRuler component that creates the illusion of infinite scrolling
function CircularRuler({ currentValue, onValueChange }: { currentValue: number; onValueChange: (value: number) => void }) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [value, setValue] = useState(currentValue);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const lastScrollPosition = useRef(0);
  const accumulatedOffset = useRef(currentValue);
  
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
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: centerPosition * snapSegment,
          animated: false
        });
      }
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
    // Initial setup when component mounts or currentValue changes
    setTicks(generateTicks(currentValue));
    setValue(currentValue);
    // Ensure we center the ruler after a brief delay to allow rendering
    setTimeout(centerRuler, 50);
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
                      backgroundColor: isCenter ? '#FFFFFF' : (tickValue > 0 ? '#4287f5' : '#f5d442'),
                      height: isCenter ? 50 : (isMajor ? 30 : 15),
                      marginRight: i === ticks.length - 1 ? 0 : segmentSpacing
                    }
                  ]}
                />
                {isMajor && (
                  <Text style={[
                    styles.tickLabel, 
                    { color: isCenter ? '#FFFFFF' : (tickValue > 0 ? '#4287f5' : '#f5d442') }
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
        <Text style={styles.centerText}>1</Text>
      </View>
    </View>
  );
}

export function PremiumDiscountSlider({ token, onUpdateValuation }: { token: Token; onUpdateValuation: (symbol: string, newAdjustment: number) => void }) {
  // Current token adjustment value
  const [adjustment, setAdjustment] = useState(token.adjustment || 0);
  
  // Update adjustment when token changes
  useEffect(() => {
    setAdjustment(token.adjustment || 0);
  }, [token.adjustment]);
  
  // Handle value changes from the slider
  const handleValueChange = (newValue: number) => {
    // Reverse the sign for our UI convention: 
    // Negative values = Premium (left), Positive values = Discount (right)
    const newAdjustment = -newValue;
    
    if (newAdjustment !== adjustment) {
      setAdjustment(newAdjustment);
      onUpdateValuation(token.symbol, newAdjustment);
    }
  };
  
  return (
    <View style={styles.sliderContainer}>
      {/* Premium/Discount Labels */}
      <View style={styles.labelContainer}>
        <Text style={[styles.labelText, styles.premiumText]}>Premium</Text>
        <Text style={[styles.labelText, styles.discountText]}>Discount</Text>
      </View>
      
      {/* Current adjustment display */}
      <View style={styles.currentValueContainer}>
        <Text style={styles.currentValueText}>
          {adjustment === 0 ? '' : 
           `${adjustment > 0 ? '+' : ''}$${adjustment.toFixed(2)}`}
        </Text>
      </View>
      
      {/* Circular scrolling ruler */}
      <CircularRuler 
        currentValue={-adjustment} // Negate for UI convention
        onValueChange={handleValueChange}
      />
    </View>
  );
}

export function Valuations({
  tokens,
  onUpdateValuation,
}: ValuationsProps) {
  return (
    <ThemedView
      className="flex-1 bg-[#000000] p-4 rounded-2xl pt-16"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Header section */}
      <View className="flex flex-row justify-center items-center mb-4">
        <Text className="text-xl font-semibold text-white">Valuations</Text>
      </View>
      
      {/* Token list */}
      <View className="flex-1">
        {tokens.map((token, index) => (
          <TokenRow 
            key={index} 
            token={token} 
            onUpdateValuation={onUpdateValuation} 
          />
        ))}
      </View>
    </ThemedView>
  );
}

function TokenRow({ token, onUpdateValuation }: { token: Token; onUpdateValuation: (symbol: string, newAdjustment: number) => void }) {
  return (
    <View
      className="py-6 border-b border-white/10"
      key={token.symbol}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="mr-3">
            {token.iconUrl ? (
              <Image source={{ uri: token.iconUrl }} className="w-9 h-9 rounded-full" />
            ) : (
              <View className="w-9 h-9 rounded-full bg-[#4A4A4A] justify-center items-center">
                <Text className="text-base font-bold text-white">{token.symbol.charAt(0)}</Text>
              </View>
            )}
          </View>
          <View className="justify-center">
            <Text className="text-base font-medium text-white mb-1">{token.name}</Text>
            <Text className="text-sm text-[#AAAAAA]">{token.amount} {token.symbol}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-base font-medium text-white mb-1">
            {Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(token.value)}
          </Text>
          <Text className={`text-sm ${token.adjustment >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {token.adjustment >= 0 ? 'Premium' : 'Discount'} ${Math.abs(token.adjustment).toFixed(2)}
          </Text>
        </View>
      </View>
      
      {/* Only show slider for non-USD tokens */}
      {token.symbol !== 'USD' ? (
        <PremiumDiscountSlider
          token={token}
          onUpdateValuation={onUpdateValuation}
        />
      ) : (
        <Text style={styles.usdText}>USD is the reference currency</Text>
      )}
    </View>
  );
}

// Screen component

// Initial mock data
const mockTokens = [
  {
    name: 'USD',
    symbol: 'USD',
    amount: '10.93',
    value: 10.93,
    adjustment: 0,  // No adjustment for USD
    change: 0,
    iconUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  {
    name: 'Tree',
    symbol: 'TREE',
    amount: '30',
    value: 40.55,
    adjustment: 4,  // $4 premium as shown in the image
    change: 0,
    iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  },
  {
    name: 'Fountain',
    symbol: 'FOUNTAIN',
    amount: '5',
    value: 8.37,
    adjustment: 4,  // $4 premium as shown in the image
    change: 0,
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    name: 'River Cleanup',
    symbol: 'RIVER',
    amount: '0.79',
    value: 1.09,
    adjustment: 0,
    change: 0,
    iconUrl: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
  },
];

export default function ValuationsScreen() {
  const [tokens, setTokens] = React.useState(mockTokens);
  
  // Update a token's dollar adjustment
  const updateTokenValuation = (symbol: string, newAdjustment: number) => {
    setTokens(prevTokens => 
      prevTokens.map(token => {
        if (token.symbol === symbol) {
          // Don't allow changing USD valuation
          if (symbol === 'USD') return token;
          
          return {
            ...token,
            adjustment: newAdjustment,
          };
        }
        return token;
      })
    );
  };
  
  return (
    <ThemedView style={styles.container}>
      <Valuations 
        tokens={tokens}
        onUpdateValuation={updateTokenValuation}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sliderContainer: {
    height: 140,
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  premiumText: {
    color: '#4287f5', // Blue for premium
  },
  discountText: {
    color: '#f5d442', // Yellow for discount
  },
  currentValueContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 10,
    height: 20,
  },
  currentValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  rulerContainer: {
    height: 80,
    width: '100%',
    position: 'relative',
  },
  ruler: {
    width: totalWidth,
    height: 80,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  tickContainer: {
    alignItems: 'center',
  },
  segment: {
    width: segmentWidth,
  },
  tickLabel: {
    fontSize: 10,
    marginTop: 2,
    color: '#AAAAAA',
  },
  scrollViewContainerStyle: {
    justifyContent: 'flex-end',
  },
  indicatorWrapper: {
    position: 'absolute',
    left: width / 2,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: indicatorWidth,
  },
  indicatorLine: {
    width: indicatorWidth,
    height: 70,
    backgroundColor: 'white',
    borderRadius: 1.5,
  },
  centerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  spacer: {
    width: spacerWidth,
  },
  usdText: {
    textAlign: 'center',
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 10,
  }
});