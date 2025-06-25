import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  InteractionManager,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { X, TrendingUp, TrendingDown, Edit3 } from 'lucide-react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { GestureHandlerRootView, ScrollView as GHScrollView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 700;

interface Token {
  name: string;
  symbol: string;
  amount: string;
  value: number;
  adjustment: number;
  change: number;
  iconUrl?: string;
  has_set: boolean;
}

interface ValuationEditorProps {
  visible: boolean;
  token: Token | null;
  onClose: () => void;
  onSave: (symbol: string, adjustment: number) => Promise<void>;
}

export default function ValuationEditor({ visible, token, onClose, onSave }: ValuationEditorProps) {
  const { colorScheme } = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [adjustment, setAdjustment] = useState(0);
  const [originalAdjustment, setOriginalAdjustment] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isProgrammaticScroll = useRef(false);

  // Update adjustment when token changes
  useEffect(() => {
    if (token) {
      const tokenAdjustment = token.adjustment || 0;
      lastValue.current = tokenAdjustment;
      lastHapticValue.current = tokenAdjustment;
      setAdjustment(tokenAdjustment);
      setOriginalAdjustment(tokenAdjustment);
      setInputValue(Math.abs(tokenAdjustment).toFixed(2));
    }
  }, [token]);
  
  // Handle manual input
  const handleInputChange = (text: string) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      // Too many decimal points
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      // More than 2 decimal places
      return;
    }
    setInputValue(cleaned);
  };
  
  const handleInputSubmit = useCallback(() => {
    const value = parseFloat(inputValue) || 0;
    
    let newAdjustment;
    if (adjustment === 0 && value !== 0) {
      // If at 0 and entering a value, default to Discount (positive)
      // User can click Premium/Discount buttons to change direction
      newAdjustment = value;
    } else {
      // Keep the current sign (premium/discount)
      newAdjustment = adjustment < 0 ? -value : value;
    }
    
    // Update refs immediately
    lastValue.current = newAdjustment;
    lastHapticValue.current = newAdjustment;
    
    // Update state
    setAdjustment(newAdjustment);
    
    // Update scroll position with flag to prevent feedback loop
    if (scrollViewRef.current) {
      isProgrammaticScroll.current = true;
      // Use whole dollar value for scroll position
      const wholeDollarValue = Math.round(newAdjustment);
      const scrollPosition = (wholeDollarValue + 10000) * 3;
      scrollViewRef.current.scrollTo({ x: scrollPosition, animated: true });
      
      // Reset flag after animation completes
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    }
  }, [inputValue, adjustment]);
  
  // Update input value when adjustment changes from slider
  useEffect(() => {
    if (!isEditingValue) {
      setInputValue(Math.abs(adjustment).toFixed(2));
    }
  }, [adjustment, isEditingValue]);

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      // Small delay to ensure modal is ready
      InteractionManager.runAfterInteractions(() => {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      });
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [visible]);


  // Initialize scroll position when modal opens
  useEffect(() => {
    if (visible && scrollViewRef.current && !isEditingValue) {
      // Use whole dollar value for scroll position
      const wholeDollarValue = Math.round(lastValue.current);
      const scrollPosition = (wholeDollarValue + 10000) * 3; // 3 pixels per dollar
      isProgrammaticScroll.current = true;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: scrollPosition, animated: false });
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 200);
      }, 100);
    }
  }, [visible]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // Handle scroll events with better performance
  const lastValue = useRef(adjustment);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastHapticValue = useRef<number>(adjustment);
  
  const handleScroll = useCallback((event: any) => {
    // Ignore scroll events during programmatic scrolling
    if (isProgrammaticScroll.current) {
      return;
    }
    
    const offset = event.nativeEvent.contentOffset.x;
    const value = Math.round(offset / 3) - 10000; // 3 pixels per dollar
    const clampedValue = Math.max(-10000, Math.min(10000, value));
    
    // Update value immediately for responsiveness
    // Compare against rounded value to handle decimals properly
    if (clampedValue !== Math.round(lastValue.current)) {
      // When scrolling, always snap to whole dollars (no decimal preservation)
      lastValue.current = clampedValue;
      
      // Haptic feedback for every $10 change
      const lastTen = Math.floor(lastHapticValue.current / 10);
      const currentTen = Math.floor(clampedValue / 10);
      if (lastTen !== currentTen) {
        Haptics.selectionAsync();
        lastHapticValue.current = clampedValue;
      }
      
      // Clear any pending timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // Defer state update slightly to batch multiple updates
      scrollTimeout.current = setTimeout(() => {
        setAdjustment(clampedValue);
      }, 0);
    }
  }, []);

  const handleSave = async () => {
    if (token && !isSaving) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsSaving(true);
      try {
        await onSave(token.symbol, adjustment);
        onClose();
      } catch (error) {
        console.error('Failed to save valuation:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleUndo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    lastValue.current = originalAdjustment;
    lastHapticValue.current = originalAdjustment;
    setAdjustment(originalAdjustment);
    if (scrollViewRef.current) {
      isProgrammaticScroll.current = true;
      const scrollPosition = (originalAdjustment + 10000) * 3;
      scrollViewRef.current.scrollTo({ x: scrollPosition, animated: true });
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    }
  };

  if (!token) return null;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.modalContainer}>
        <View style={styles.modalContainer} pointerEvents="box-none">
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.backdrop}>
              <BlurView
                intensity={20}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          </TouchableWithoutFeedback>

          <Animated.View
            pointerEvents="box-none"
            style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
              backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colorScheme === 'dark' ? '#48484A' : '#D1D1D6' }]} />
          </View>

          {/* Header */}
          <View className="relative">
            <TouchableOpacity onPress={onClose} className="absolute right-4 top-0 z-10">
              <View className={`w-9 h-9 rounded-full items-center justify-center ${
                colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <X size={20} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              </View>
            </TouchableOpacity>
            
            <View className="items-center mb-4 pt-2">
              {token.iconUrl ? (
                <Image 
                  source={{ uri: token.iconUrl }} 
                  className="w-16 h-16 rounded-full mb-3"
                  style={{
                    borderWidth: 1,
                    borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                  }}
                />
              ) : (
                <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${
                  colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <ThemedText className="text-2xl font-bold">
                    {token.symbol.charAt(0)}
                  </ThemedText>
                </View>
              )}
              <ThemedText className="text-2xl font-bold">{token.name}</ThemedText>
              <ThemedText className="text-base opacity-60">{token.symbol}</ThemedText>
            </View>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <TouchableWithoutFeedback onPress={() => {
              if (isEditingValue) {
                Keyboard.dismiss();
              }
            }}>
              <View>
            {/* Adjustment Bubble with Edit Functionality */}
            <View className="items-center mb-4">
              <ThemedText className="text-sm opacity-60 mb-3">
                {adjustment === 0 ? 'Your Adjustment' : adjustment > 0 ? 'Your Discount' : 'Your Premium'}
              </ThemedText>
              
              <TouchableOpacity 
                onPress={() => {
                  if (!isEditingValue) {
                    setIsEditingValue(true);
                    // Show empty input if value is 0, otherwise show the value
                    setInputValue(adjustment === 0 ? '' : Math.abs(adjustment).toFixed(2));
                  }
                }}
                activeOpacity={0.8}
              >
                <View className={`rounded-3xl py-4 px-8 ${
                  colorScheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`} style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 5,
                  minWidth: 160,
                }}>
                  {isEditingValue ? (
                    <View className="flex-row items-center justify-center">
                      <Text className={`text-3xl font-bold ${
                        adjustment === 0 ? 'text-gray-400' : (adjustment > 0 ? 'text-green-500' : 'text-yellow-500')
                      }`}>$</Text>
                      <TextInput
                        ref={inputRef}
                        className={`text-3xl font-bold min-w-[100px] text-center ${
                          adjustment === 0 ? 'text-gray-400' : (adjustment > 0 ? 'text-green-500' : 'text-yellow-500')
                        }`}
                        style={{ outline: 'none' }}
                        value={inputValue}
                        onChangeText={handleInputChange}
                        keyboardType="decimal-pad"
                        autoFocus
                        selectTextOnFocus
                        onBlur={() => {
                          handleInputSubmit();
                          setIsEditingValue(false);
                        }}
                        onSubmitEditing={() => {
                          handleInputSubmit();
                          setIsEditingValue(false);
                        }}
                      />
                    </View>
                  ) : (
                    <View className="flex-row items-center justify-center">
                      <ThemedText 
                        className={`text-3xl font-bold ${
                          adjustment === 0 ? 'text-gray-400' : (adjustment > 0 ? 'text-green-500' : 'text-yellow-500')
                        }`}
                      >
                        ${adjustment === 0 ? '0' : Math.abs(adjustment).toFixed(2)}
                      </ThemedText>
                      <View className={`ml-2 p-1.5 rounded-full ${
                        colorScheme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
                      }`}>
                        <Edit3 size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              
              <View className="flex-row items-center mt-4 gap-3">
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    
                    // Get current absolute value, using input if being edited
                    let absValue = Math.abs(adjustment);
                    if (isEditingValue && inputValue) {
                      absValue = parseFloat(inputValue) || 0;
                      // Close the text input
                      setIsEditingValue(false);
                      Keyboard.dismiss();
                    }
                    
                    const newValue = -absValue;
                    lastValue.current = newValue;
                    lastHapticValue.current = newValue;
                    setAdjustment(newValue);
                    
                    if (scrollViewRef.current) {
                      isProgrammaticScroll.current = true;
                      const wholeDollarValue = Math.round(newValue);
                      const scrollPosition = (10000 + wholeDollarValue) * 3;
                      scrollViewRef.current.scrollTo({ x: scrollPosition, animated: false });
                      setTimeout(() => {
                        isProgrammaticScroll.current = false;
                      }, 100);
                    }
                  }}
                  className={`px-4 py-2 rounded-full ${
                    adjustment < 0 
                      ? 'bg-yellow-500' 
                      : (colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')
                  }`}
                >
                  <ThemedText className={`text-sm font-medium ${
                    adjustment < 0 ? 'text-white' : ''
                  }`}>Premium</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    
                    // Get current absolute value, using input if being edited
                    let absValue = Math.abs(adjustment);
                    if (isEditingValue && inputValue) {
                      absValue = parseFloat(inputValue) || 0;
                      // Close the text input
                      setIsEditingValue(false);
                      Keyboard.dismiss();
                    }
                    
                    lastValue.current = absValue;
                    lastHapticValue.current = absValue;
                    setAdjustment(absValue);
                    
                    if (scrollViewRef.current) {
                      isProgrammaticScroll.current = true;
                      const wholeDollarValue = Math.round(absValue);
                      const scrollPosition = (10000 + wholeDollarValue) * 3;
                      scrollViewRef.current.scrollTo({ x: scrollPosition, animated: false });
                      setTimeout(() => {
                        isProgrammaticScroll.current = false;
                      }, 100);
                    }
                  }}
                  className={`px-4 py-2 rounded-full ${
                    adjustment > 0 
                      ? 'bg-green-500' 
                      : (colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')
                  }`}
                >
                  <ThemedText className={`text-sm font-medium ${
                    adjustment > 0 ? 'text-white' : ''
                  }`}>Discount</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dynamic Explanation Text */}
            <View className={`mx-4 mb-4 p-3 rounded-2xl ${
              colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <ThemedText className="text-sm opacity-80 leading-relaxed text-center">
                {adjustment === 0 
                  ? "You will not provide a premium or discount for tokens received for this cause."
                  : adjustment > 0 
                    ? `For every $10 a user pays in ${token.name}, you will provide a $${Math.min(Math.abs(adjustment), 2).toFixed(2)} discount.`
                    : `For every $10 a user pays in ${token.name}, you will charge a $${Math.min(Math.abs(adjustment), 2).toFixed(2)} premium.`
                }
              </ThemedText>
            </View>

            {/* Scrollable Scale Slider */}
            <View className="mt-4">
              <View className="mb-4 px-4">
                <View className="flex-row justify-between items-center mb-1">
                  <ThemedText className="text-xs font-medium opacity-60">Swipe to adjust</ThemedText>
                </View>
                <View className="flex-row justify-between">
                  <ThemedText className="text-sm font-medium text-yellow-500">Premium</ThemedText>
                  <ThemedText className="text-sm font-medium text-green-500">Discount</ThemedText>
                </View>
              </View>

              {/* Scale Container - Responsive height for better touch area */}
              <View style={{ height: IS_SMALL_DEVICE ? 80 : 120, position: 'relative', marginVertical: IS_SMALL_DEVICE ? 5 : 10, marginBottom: IS_SMALL_DEVICE ? 10 : 20 }}>
                
                {/* Center Line Indicator - clean and minimal */}
                <View 
                  style={{
                    position: 'absolute',
                    left: SCREEN_WIDTH / 2 - 1,
                    top: 25,
                    bottom: 25,
                    width: 2,
                    backgroundColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                    opacity: 0.3,
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                />
                
                {/* Scrollable Scale */}
                <GHScrollView
                  ref={scrollViewRef}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  decelerationRate="fast"
                  snapToInterval={3}
                  bounces={false}
                  overScrollMode="never"
                  contentContainerStyle={{
                    paddingHorizontal: SCREEN_WIDTH / 2,
                  }}
                >
                  <View style={{ 
                    width: 60000, // 20000 values * 3 pixels each
                    height: IS_SMALL_DEVICE ? 80 : 120,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    {/* Background zones for premium/discount with gradient effect */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 30000,
                        top: 20,
                        bottom: 20,
                        backgroundColor: '#EAB308',
                        opacity: 0.08,
                        borderRadius: 40,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        left: 30000,
                        right: 0,
                        top: 20,
                        bottom: 20,
                        backgroundColor: '#22C55E',
                        opacity: 0.08,
                        borderRadius: 40,
                      }}
                    />
                    
                    {/* Generate tick marks - optimized for performance */}
                    {Array.from({ length: 401 }, (_, i) => {
                      const value = (i - 200) * 50; // -10000 to 10000 in steps of 50
                      const isMajor = value % 500 === 0;
                      const isZero = value === 0;
                      
                      // Only render visible ticks
                      return (
                        <React.Fragment key={i}>
                          <View
                            style={{
                              position: 'absolute',
                              left: (value + 10000) * 3, // Convert to pixel position
                              width: isZero ? 3 : (isMajor ? 3 : 1.5),
                              height: isZero ? (IS_SMALL_DEVICE ? 40 : 60) : (isMajor ? (IS_SMALL_DEVICE ? 40 : 60) : (IS_SMALL_DEVICE ? 25 : 35)),
                              backgroundColor: isZero 
                                ? (colorScheme === 'dark' ? '#FFFFFF' : '#000000')
                                : (value < 0 ? '#EAB308' : '#22C55E'), // Yellow for premium, Green for discount
                              opacity: isZero ? 0.4 : (isMajor ? 1 : 0.7),
                              bottom: isZero ? (IS_SMALL_DEVICE ? 20 : 30) : (isMajor ? (IS_SMALL_DEVICE ? 20 : 30) : (IS_SMALL_DEVICE ? 27.5 : 42.5)),
                              borderRadius: 1,
                            }}
                          />
                          {isMajor && (
                            <Text 
                              style={{
                                position: 'absolute',
                                left: (value + 10000) * 3 - 20,
                                bottom: IS_SMALL_DEVICE ? 5 : 10,
                                width: 40,
                                textAlign: 'center',
                                fontSize: IS_SMALL_DEVICE ? (isZero ? 12 : 10) : (isZero ? 14 : 12),
                                color: isZero 
                                  ? (colorScheme === 'dark' ? '#FFFFFF' : '#000000')
                                  : (colorScheme === 'dark' ? '#D1D5DB' : '#4B5563'),
                                fontWeight: isZero ? '600' : '500',
                              }}
                            >
                              {value === 0 ? '0' : `${Math.abs(value)}`}
                            </Text>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </View>
                </GHScrollView>
                
                {/* Gradient Fade Edges - subtle fade effect */}
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: IS_SMALL_DEVICE ? 15 : 20,
                    bottom: IS_SMALL_DEVICE ? 15 : 20,
                    width: 40,
                    pointerEvents: 'none',
                    flexDirection: 'row',
                  }}
                >
                  <View 
                    style={{
                      flex: 1,
                      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                      opacity: 0.7,
                    }}
                  />
                  <View 
                    style={{
                      width: 10,
                      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                      opacity: 0.3,
                    }}
                  />
                  <View 
                    style={{
                      width: 10,
                      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                      opacity: 0.1,
                    }}
                  />
                </View>
                <View
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: IS_SMALL_DEVICE ? 15 : 20,
                    bottom: IS_SMALL_DEVICE ? 15 : 20,
                    width: 40,
                    pointerEvents: 'none',
                    flexDirection: 'row',
                  }}
                >
                  <View 
                    style={{
                      width: 10,
                      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                      opacity: 0.1,
                    }}
                  />
                  <View 
                    style={{
                      width: 10,
                      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                      opacity: 0.3,
                    }}
                  />
                  <View 
                    style={{
                      flex: 1,
                      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                      opacity: 0.7,
                    }}
                  />
                </View>
              </View>
            </View>

              </View>
            </TouchableWithoutFeedback>
          </ScrollView>

          {/* Action buttons with spacing */}
          <View className="flex-row px-5 pt-3 pb-2 gap-4">
            <TouchableOpacity
              className={`flex-1 py-4 rounded-2xl items-center justify-center ${
                colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
              } ${adjustment === originalAdjustment ? 'opacity-50' : ''}`}
              onPress={handleUndo}
              disabled={adjustment === originalAdjustment}
            >
              <Text className={`text-base font-semibold ${
                colorScheme === 'dark' ? 'text-white' : 'text-black'
              }`}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-4 rounded-2xl items-center justify-center bg-blue-500"
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-base font-semibold text-white">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: IS_SMALL_DEVICE ? SCREEN_HEIGHT * 0.95 : SCREEN_HEIGHT * 0.85,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  content: {
    paddingHorizontal: 20,
    flex: 1,
  },
  valueSection: {
    marginBottom: 24,
  },
  valueLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  adjustmentDisplay: {
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  adjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  adjustmentLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  adjustmentValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adjustmentAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  finalValue: {
    fontSize: 14,
    opacity: 0.8,
  },
  sliderSection: {
    marginBottom: 32,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  sliderContainer: {
    height: 60,
    justifyContent: 'center',
    marginBottom: 8,
  },
  sliderTrack: {
    position: 'absolute',
    height: 6,
    width: '100%',
    borderRadius: 3,
  },
  centerLine: {
    position: 'absolute',
    width: 2,
    height: 12,
    left: '50%',
    marginLeft: -1,
  },
  sliderFill: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderThumbActive: {
    transform: [{ scale: 1.2 }],
  },
  thumbInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  touchOverlay: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: 0,
    right: 0,
  },
  tickContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  tickWrapper: {
    alignItems: 'center',
  },
  tick: {
    width: 1,
    height: 8,
    marginBottom: 4,
  },
  tickLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {},
  saveButton: {},
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});