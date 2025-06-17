import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { X, TrendingUp, TrendingDown } from 'lucide-react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);
  const maxRange = 500; // Fixed max range

  // Update adjustment when token changes
  useEffect(() => {
    if (token) {
      setAdjustment(token.adjustment || 0);
    }
  }, [token]);

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [visible]);


  // Handle slider interaction with non-linear scale
  const handleSliderPress = (evt: any) => {
    const touchX = evt.nativeEvent.locationX;
    if (sliderWidth > 0) {
      const percentage = Math.max(0, Math.min(1, touchX / sliderWidth));
      
      // Dynamic non-linear scale that adapts to current value
      let mappedValue;
      const currentRange = Math.max(50, Math.abs(adjustment) + 50);
      
      if (percentage >= 0.45 && percentage <= 0.55) {
        // Small linear zone in center for fine control
        mappedValue = (percentage - 0.5) * currentRange * 0.4;
      } else if (percentage < 0.45) {
        // Progressive exponential on left
        const normalized = (0.45 - percentage) / 0.45;
        const expo = Math.pow(normalized, 1.5);
        mappedValue = -currentRange * 0.2 - (expo * currentRange * 2);
      } else {
        // Progressive exponential on right
        const normalized = (percentage - 0.55) / 0.45;
        const expo = Math.pow(normalized, 1.5);
        mappedValue = currentRange * 0.2 + (expo * currentRange * 2);
      }
      
      const newAdjustment = Math.round(mappedValue * 10) / 10;
      setAdjustment(Math.max(-1000, Math.min(1000, newAdjustment)));
    }
  };

  // Create pan responder for slider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        if (sliderWidth > 0) {
          const percentage = Math.max(0, Math.min(1, touchX / sliderWidth));
          
          // Dynamic non-linear scale that adapts to current value
          let mappedValue;
          const currentRange = Math.max(50, Math.abs(adjustment) + 50);
          
          if (percentage >= 0.45 && percentage <= 0.55) {
            // Small linear zone in center for fine control
            mappedValue = (percentage - 0.5) * currentRange * 0.4;
          } else if (percentage < 0.45) {
            // Progressive exponential on left
            const normalized = (0.45 - percentage) / 0.45;
            const expo = Math.pow(normalized, 1.5);
            mappedValue = -currentRange * 0.2 - (expo * currentRange * 2);
          } else {
            // Progressive exponential on right
            const normalized = (percentage - 0.55) / 0.45;
            const expo = Math.pow(normalized, 1.5);
            mappedValue = currentRange * 0.2 + (expo * currentRange * 2);
          }
          
          const newAdjustment = Math.round(mappedValue * 10) / 10;
          setAdjustment(Math.max(-1000, Math.min(1000, newAdjustment)));
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    })
  ).current;

  const handleSave = async () => {
    if (token && !isSaving) {
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

  const handleReset = () => {
    setAdjustment(0);
  };

  if (!token) return null;

  // Calculate display range based on current adjustment
  const displayRange = Math.max(50, Math.ceil(Math.abs(adjustment) / 50) * 50 + 50);
  
  // Calculate the position of the thumb on the slider using dynamic scaling
  const getThumbPosition = () => {
    if (sliderWidth === 0) return sliderWidth / 2;
    
    const currentRange = Math.max(50, Math.abs(adjustment) + 50);
    
    // Inverse of the dynamic non-linear mapping
    if (Math.abs(adjustment) <= currentRange * 0.2) {
      // Linear range
      return (adjustment / (currentRange * 0.4) + 0.5) * sliderWidth;
    } else if (adjustment < -currentRange * 0.2) {
      // Left exponential
      const valueOffset = Math.abs(adjustment) - currentRange * 0.2;
      const normalized = Math.pow(valueOffset / (currentRange * 2), 1/1.5);
      return (0.45 - normalized * 0.45) * sliderWidth;
    } else {
      // Right exponential
      const valueOffset = adjustment - currentRange * 0.2;
      const normalized = Math.pow(valueOffset / (currentRange * 2), 1/1.5);
      return (0.55 + normalized * 0.45) * sliderWidth;
    }
  };
  
  const thumbPosition = getThumbPosition();
  const fillWidth = Math.abs(thumbPosition - sliderWidth / 2);
  const fillOffset = adjustment < 0 ? thumbPosition : sliderWidth / 2;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <BlurView
            intensity={20}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
        </TouchableOpacity>

        <Animated.View
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
            
            <View className="items-center mb-6 pt-2">
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

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Adjustment display */}
            <View className={`mx-4 p-6 rounded-2xl ${
              colorScheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <View className="items-center">
                <ThemedText className="text-sm opacity-60 mb-2">Your Adjustment</ThemedText>
                <View className="min-w-full px-4">
                  <ThemedText 
                    className={`text-3xl font-bold text-center ${
                      adjustment === 0 ? 'text-gray-400' : (adjustment > 0 ? 'text-green-500' : 'text-yellow-500')
                    }`}
                  >
                    {adjustment > 0 ? '+' : ''}{adjustment < 0 ? '-' : ''}${Math.abs(adjustment).toFixed(2)}
                  </ThemedText>
                </View>
                <ThemedText className="text-xs opacity-50 mt-1">
                  {adjustment === 0 ? 'No adjustment' : (adjustment > 0 ? 'Discount' : 'Premium')}
                </ThemedText>
              </View>
            </View>

            {/* Slider section */}
            <View className="mt-8 px-4">
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <ThemedText className="text-xs font-medium opacity-60">Slide to adjust</ThemedText>
                  {Math.abs(adjustment) > 50 && (
                    <View className={`px-2 py-0.5 rounded-full ${colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <ThemedText className="text-xs font-medium">
                        Extended Range
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View className="flex-row justify-between">
                  <ThemedText className="text-sm font-medium text-yellow-500">Premium</ThemedText>
                  <View className="flex-row items-center">
                    <View className="w-16 h-px bg-gray-300 dark:bg-gray-600 mx-2" />
                    <ThemedText className="text-xs opacity-60">$0</ThemedText>
                    <View className="w-16 h-px bg-gray-300 dark:bg-gray-600 mx-2" />
                  </View>
                  <ThemedText className="text-sm font-medium text-green-500">Discount</ThemedText>
                </View>
              </View>

              <View 
                style={styles.sliderContainer}
                onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
              >
                {/* Background track */}
                <View style={[styles.sliderTrack, { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#E5E5EA' }]} />
                
                {/* Center line */}
                <View style={[styles.centerLine, { backgroundColor: colorScheme === 'dark' ? '#48484A' : '#C7C7CC' }]} />
                
                {/* Colored fill */}
                {adjustment !== 0 && (
                  <View
                    style={[
                      styles.sliderFill,
                      {
                        backgroundColor: adjustment > 0 ? '#22C55E' : '#EAB308',
                        width: fillWidth,
                        left: adjustment < 0 ? fillOffset : sliderWidth / 2,
                      },
                    ]}
                  />
                )}
                
                {/* Edge glow and continuation indicator */}
                {Math.abs(adjustment) > displayRange * 0.7 && (
                  <>
                    <Animated.View 
                      className="absolute h-full w-20"
                      style={{
                        [adjustment > 0 ? 'right' : 'left']: 0,
                        opacity: ((Math.abs(adjustment) - displayRange * 0.7) / (displayRange * 0.3)) * 0.4,
                        backgroundColor: adjustment > 0 ? '#22C55E' : '#EAB308',
                      }}
                    />
                    <View 
                      className="absolute h-full w-px"
                      style={{
                        [adjustment > 0 ? 'right' : 'left']: 0,
                        backgroundColor: adjustment > 0 ? '#22C55E' : '#EAB308',
                        opacity: 0.8,
                      }}
                    />
                    {/* Continuation arrows */}
                    <View 
                      className="absolute"
                      style={{
                        [adjustment > 0 ? 'right' : 'left']: 8,
                        top: '50%',
                        transform: [{ translateY: -12 }],
                      }}
                    >
                      <ThemedText className="text-lg font-bold" style={{
                        color: adjustment > 0 ? '#22C55E' : '#EAB308',
                        opacity: 0.8,
                      }}>
                        {adjustment > 0 ? '»»' : '««'}
                      </ThemedText>
                    </View>
                  </>
                )}
                
                {/* Thumb */}
                <View
                  style={[
                    styles.sliderThumb,
                    {
                      left: thumbPosition - 15,
                      backgroundColor: '#FFFFFF',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 5,
                    },
                    isDragging && styles.sliderThumbActive,
                  ]}
                >
                  <View style={[styles.thumbInner, { backgroundColor: colorScheme === 'dark' ? '#007AFF' : '#007AFF' }]} />
                </View>
                
                {/* Touch overlay for better gesture handling */}
                <View 
                  style={styles.touchOverlay}
                  onTouchStart={handleSliderPress}
                  onTouchMove={handleSliderPress}
                  {...panResponder.panHandlers}
                />
              </View>

              {/* Dynamic scale marks */}
              <View style={styles.tickContainer}>
                {/* Center mark at $0 */}
                <View style={[styles.tickWrapper, { position: 'absolute', left: sliderWidth / 2 - 1 }]}>
                  <View style={[styles.tick, { 
                    backgroundColor: colorScheme === 'dark' ? '#48484A' : '#C7C7CC',
                    height: 12,
                    width: 2,
                  }]} />
                  <ThemedText style={[styles.tickLabel, { opacity: 1 }]}>
                    $0
                  </ThemedText>
                </View>
                
                {/* Dynamic scale marks based on current value */}
                {(() => {
                  const marks = [];
                  const absAdjustment = Math.abs(adjustment);
                  
                  // Determine scale marks based on current value
                  let stepSize = 25;
                  if (absAdjustment > 100) stepSize = 50;
                  if (absAdjustment > 200) stepSize = 100;
                  if (absAdjustment > 400) stepSize = 200;
                  
                  // Generate marks
                  for (let i = stepSize; i <= Math.max(100, displayRange); i += stepSize) {
                    // Left side (negative/premium)
                    marks.push(
                      <View 
                        key={`left-${i}`} 
                        style={[styles.tickWrapper, { 
                          position: 'absolute', 
                          left: sliderWidth / 2 - (i / displayRange * sliderWidth / 2) - 1,
                          opacity: i > displayRange * 0.8 ? 0.3 : 1,
                        }]}
                      >
                        <View style={[styles.tick, { 
                          backgroundColor: colorScheme === 'dark' ? '#48484A' : '#C7C7CC',
                          height: 8,
                        }]} />
                        {i <= displayRange * 0.8 && (
                          <ThemedText style={[styles.tickLabel, { opacity: 0.6 }]}>
                            -${i}
                          </ThemedText>
                        )}
                      </View>
                    );
                    
                    // Right side (positive/discount)
                    marks.push(
                      <View 
                        key={`right-${i}`} 
                        style={[styles.tickWrapper, { 
                          position: 'absolute', 
                          left: sliderWidth / 2 + (i / displayRange * sliderWidth / 2) - 1,
                          opacity: i > displayRange * 0.8 ? 0.3 : 1,
                        }]}
                      >
                        <View style={[styles.tick, { 
                          backgroundColor: colorScheme === 'dark' ? '#48484A' : '#C7C7CC',
                          height: 8,
                        }]} />
                        {i <= displayRange * 0.8 && (
                          <ThemedText style={[styles.tickLabel, { opacity: 0.6 }]}>
                            +${i}
                          </ThemedText>
                        )}
                      </View>
                    );
                  }
                  
                  return marks;
                })()}
              </View>
            </View>

            {/* Info section */}
            <View className={`mx-4 p-4 rounded-xl ${
              colorScheme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
            }`}>
              <ThemedText className="text-sm text-center opacity-80 leading-5">
                Adjust your personal valuation. Positive values represent discounts, negative values represent premiums.
              </ThemedText>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View className="flex-row px-5 pt-5 pb-2 space-x-3">
            <TouchableOpacity
              className={`flex-1 py-4 rounded-2xl items-center justify-center ${
                colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
              } ${adjustment === 0 ? 'opacity-50' : ''}`}
              onPress={handleReset}
              disabled={adjustment === 0}
            >
              <Text className={`text-base font-semibold ${
                colorScheme === 'dark' ? 'text-white' : 'text-black'
              }`}>Reset</Text>
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
    maxHeight: SCREEN_HEIGHT * 0.85,
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