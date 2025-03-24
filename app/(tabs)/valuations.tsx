import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
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

export function PremiumDiscountSlider({ token, onUpdateValuation }: { token: Token; onUpdateValuation: (symbol: string, newAdjustment: number) => void }) {
  // Current token adjustment value
  const [adjustment, setAdjustment] = useState(token.adjustment || 0);
  
  // Update adjustment when token changes
  useEffect(() => {
    setAdjustment(token.adjustment || 0);
  }, [token.adjustment]);
  
  // Handle value changes from the slider
  const handleValueChange = (newValue: number) => {
    if (newValue !== adjustment) {
      setAdjustment(newValue);
      onUpdateValuation(token.symbol, newValue);
    }
  };
  
  return (
    <View style={styles.sliderContainer}>
      {/* Premium/Discount Labels */}
      <View style={styles.labelContainer}>
        <Text className="text-xs font-medium text-blue-300 dark:text-blue-300">Premium</Text>
        <Text className="text-xs font-medium text-amber-100 dark:text-amber-100">Discount</Text>
      </View>
      
      
      {/* Circular scrolling ruler */}
      <CircularRuler 
        currentValue={adjustment} 
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
      className="flex-1 bg-white dark:bg-black p-4 rounded-2xl pt-16"
    >
      {/* Header section */}
      <View className="flex flex-row justify-center items-center mb-4">
        <Text className="text-xl font-semibold text-black dark:text-white">Valuations</Text>
      </View>
      
      {/* Token list - wrapped in ScrollView to make it scrollable */}
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        bounces={true}
      >
        {tokens.map((token, index) => (
          <TokenRow 
            key={index} 
            token={token} 
            onUpdateValuation={onUpdateValuation} 
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

function TokenRow({ token, onUpdateValuation }: { token: Token; onUpdateValuation: (symbol: string, newAdjustment: number) => void }) {
  return (
    <View
      className="py-6 border-b border-gray-200 dark:border-white/10"
      key={token.symbol}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="mr-3">
            {token.iconUrl ? (
              <Image source={{ uri: token.iconUrl }} className="w-9 h-9 rounded-full" />
            ) : (
              <View className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 justify-center items-center">
                <Text className="text-base font-bold text-black dark:text-white">{token.symbol.charAt(0)}</Text>
              </View>
            )}
          </View>
          <View className="justify-center">
            <Text className="text-base font-medium text-black dark:text-white mb-1">{token.name}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">{token.symbol}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-base font-medium text-black dark:text-white mb-1">
            {Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(token.value)}
          </Text>
          <Text className={`text-sm text-gray-400`}>
            {token.adjustment !== 0 ? (token.adjustment < 0 ? 'Premium' : 'Discount') + ` ${Math.abs(token.adjustment).toFixed(2)}` : ''}
          </Text>
        </View>
      </View>
      
      {/* Only show slider for non-USD tokens */}
      {token.symbol !== 'USD' ? (
        <PremiumDiscountSlider
          token={token}
          onUpdateValuation={onUpdateValuation}
        />
      ) : null}
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
    <ThemedView className="flex-1 bg-white dark:bg-black pb-10">
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
    paddingBottom: 40,
  },
  sliderContainer: {
    height: 80,
    width: '100%',
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
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 10,
    height: 20,
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
    width: 3, // Increased from 2 to 3 for thickness
    height: 50,
    backgroundColor: '#000000',
    borderRadius: 2, // Increased from 1.5 to 2 for roundness
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
  }
});