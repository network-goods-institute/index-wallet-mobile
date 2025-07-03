import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  PanResponder, 
  Text, 
  TouchableOpacity,
  LayoutChangeEvent,
  Dimensions
} from 'react-native';
import { ThemedView } from '@/components/core/ThemedView';

interface ValuationSliderProps {
  tokenName: string;
  tokenSymbol?: string;
  averageValuation: number;
  value: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  trackColor?: string;
  indicatorColor?: string;
  averageMarkerColor?: string;
  onDone?: () => void;
}

export function ValuationSlider({
  tokenName,
  tokenSymbol,
  averageValuation,
  value,
  onValueChange,
  minValue = 0,
  maxValue = 100,
  step = 0.1,
  trackColor = 'rgba(255, 255, 255, 0.3)',
  indicatorColor = '#6C5CE7', // Modern purple
  averageMarkerColor = '#FDCB6E', // Warm yellow
  onDone
}: ValuationSliderProps) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [scaleVisibleMin, setScaleVisibleMin] = useState(0);
  const [scaleVisibleMax, setScaleVisibleMax] = useState(0);
  const [scaleVisibleRange, setScaleVisibleRange] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Initialize the visible range based on the average valuation
  useEffect(() => {
    // Set initial visible range with average valuation at center
    const initialRange = 10;
    const initialMin = Math.max(averageValuation - initialRange/2, minValue);
    const initialMax = Math.min(initialRange + initialMin, maxValue);
    
    setScaleVisibleMin(initialMin);
    setScaleVisibleMax(initialMax);
    setScaleVisibleRange(initialMax - initialMin);
  }, [averageValuation, minValue, maxValue]);

  // Update visibleRange when min or max changes
  useEffect(() => {
    setScaleVisibleRange(scaleVisibleMax - scaleVisibleMin);
  }, [scaleVisibleMin, scaleVisibleMax]);

  // Update current value when visible range changes
  useEffect(() => {
    if (sliderWidth > 0) {
      // The indicator is in the center, so get value at center position
      onValueChange(getValueFromPosition(sliderWidth / 2));
    }
  }, [scaleVisibleMin, scaleVisibleMax, sliderWidth]);

  // Convert from screen position to value
  const getValueFromPosition = (offsetX: number): number => {
    if (sliderWidth === 0 || scaleVisibleRange === 0) return minValue;
    
    // Map the offset to our visible range
    const ratio = offsetX / sliderWidth;
    let rawValue = scaleVisibleMin + (ratio * scaleVisibleRange);
    
    // Apply stepping if needed
    if (step) {
      rawValue = Math.round(rawValue / step) * step;
    }
    
    // Ensure value stays within bounds
    return Math.max(minValue, Math.min(maxValue, rawValue));
  };

  // Convert from value to screen position
  const getPositionFromValue = (val: number): number => {
    if (sliderWidth === 0 || scaleVisibleRange === 0) return 0;
    
    // If value is outside visible range, return edge position
    if (val < scaleVisibleMin) return 0;
    if (val > scaleVisibleMax) return sliderWidth;
    
    // Get position within the visible window
    const ratio = (val - scaleVisibleMin) / scaleVisibleRange;
    return ratio * sliderWidth;
  };

  // Create pan responder for dragging the scale
  const scalePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
    },
    onPanResponderMove: (_, gestureState) => {
      // Apply non-linear scaling for more natural feeling
      const dragSpeed = Math.abs(gestureState.vx);
      const dragScale = Math.min(1 + dragSpeed * 3, 5); // Cap at 5x scaling
      
      // Calculate drag amount with scaling factor
      const scaledDx = gestureState.dx * dragScale;
      const dragAmount = scaledDx / sliderWidth * scaleVisibleRange;
      
      // Move in the opposite direction of drag (scale moves under fixed indicator)
      const newMin = Math.max(minValue, scaleVisibleMin - dragAmount);
      const newMax = Math.min(maxValue, scaleVisibleMax - dragAmount);
      
      if (newMin >= minValue && newMax <= maxValue) {
        setScaleVisibleMin(newMin);
        setScaleVisibleMax(newMax);
      }
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
    }
  });

  // Handle layout changes
  const onLayoutChange = (event: LayoutChangeEvent) => {
    const newWidth = event.nativeEvent.layout.width;
    setSliderWidth(newWidth);
  };

  // Generate tick marks and labels for the scale
  const renderTicks = () => {
    const ticks = [];
    const screenWidth = Dimensions.get('window').width;
    const availableWidth = Math.min(sliderWidth, screenWidth - 40);
    
    // Adjust tick density based on available width
    const ticksToShow = Math.max(4, Math.min(10, Math.floor(availableWidth / 40)));
    const majorStep = Math.max(step, Math.ceil(scaleVisibleRange / ticksToShow));
    
    // Start from a nice round number
    const startTick = Math.ceil(scaleVisibleMin / majorStep) * majorStep;
    
    for (let i = startTick; i <= scaleVisibleMax; i += majorStep) {
      // Calculate position for this tick
      const position = getPositionFromValue(i);
      
      // Only render if it's within our view area with some padding
      if (position >= -20 && position <= sliderWidth + 20) {
        const isCurrentValue = Math.abs(i - value) < step / 2;
        const isAverage = Math.abs(i - averageValuation) < step / 2;
        
        ticks.push(
          <View key={`tick-${i}`} style={[
            styles.tick, 
            { left: position },
            isCurrentValue && styles.tickHighlighted,
            isAverage && styles.tickAverage
          ]}>
            <Text style={[
              styles.tickLabel,
              isCurrentValue && styles.tickLabelHighlighted,
              isAverage && styles.tickLabelAverage
            ]}>
              {i % 1 === 0 ? i : i.toFixed(1)}
            </Text>
          </View>
        );
      }
    }
    
    return ticks;
  };

  // Render average valuation marker
  const renderAverageMarker = () => {
    // Check if average is in visible range
    const isInRange = averageValuation >= scaleVisibleMin && averageValuation <= scaleVisibleMax;
    
    if (!isInRange) {
      // Render arrow indicator if out of view
      const isLeft = averageValuation < scaleVisibleMin;
      return (
        <View style={[
          styles.averageArrow,
          isLeft ? { left: 10 } : { right: 10 }
        ]}>
          <Text style={[styles.averageArrowText, { color: averageMarkerColor }]}>
            {isLeft ? '◄' : '►'} avg {averageValuation}
          </Text>
        </View>
      );
    }
    
    // Otherwise show the marker line at the average position
    const position = getPositionFromValue(averageValuation);
    return (
      <View 
        style={[
          styles.averageMarker, 
          { 
            left: position,
            backgroundColor: averageMarkerColor 
          }
        ]}
      >
        <Text style={styles.averageLabel}>{averageValuation}</Text>
      </View>
    );
  };

  // Render the centered indicator line
  const renderCenterIndicator = () => {
    return (
      <View style={[styles.centerIndicator, { backgroundColor: indicatorColor }]}>
        <View style={[styles.centerIndicatorArrow, { borderBottomColor: indicatorColor }]} />
      </View>
    );
  };

  // Handle revert button press
  const handleRevert = () => {
    // Center the scale around the average
    const halfRange = scaleVisibleRange / 2;
    setScaleVisibleMin(Math.max(averageValuation - halfRange, minValue));
    setScaleVisibleMax(Math.min(averageValuation + halfRange, maxValue));
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.headerRow}>
        <View style={styles.tokenHeader}>
          <Text style={styles.tokenName}>{tokenName}</Text>
          {tokenSymbol && <Text style={styles.tokenSymbol}>{tokenSymbol}</Text>}
        </View>
        <View style={styles.valueDisplay}>
          <Text style={styles.valueLabelPrefix}>Your Valuation</Text>
          <Text style={styles.currentValue}>{value.toFixed(1)}</Text>
        </View>
      </View>
      
      <ThemedView
        onLayout={onLayoutChange}
        style={[styles.container, isDragging && styles.containerActive]}
        {...scalePanResponder.panHandlers}
      >
        {/* Main track */}
        <View style={[styles.track, { backgroundColor: trackColor }]} />
        
        {/* Scale ticks */}
        {sliderWidth > 0 && renderTicks()}
        
        {/* Average valuation marker */}
        {sliderWidth > 0 && renderAverageMarker()}
        
        {/* Center indicator line */}
        {renderCenterIndicator()}
      </ThemedView>
      
      
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.button, styles.revertButton]} 
          onPress={handleRevert}
        >
          <Text style={styles.revertButtonText}>REVERT</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.doneButton]}
          onPress={onDone}
        >
          <Text style={styles.doneButtonText}>DONE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    backgroundColor: '#1A1A2E', // Dark blue background
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  tokenSymbol: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  valueDisplay: {
    alignItems: 'flex-end',
  },
  valueLabelPrefix: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  container: {
    height: 100,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  containerActive: {
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  track: {
    height: 2,
    width: '100%',
    position: 'absolute',
    top: '50%',
    marginTop: -1,
  },
  tick: {
    position: 'absolute',
    height: 16,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    top: '50%',
    marginTop: -8,
  },
  tickHighlighted: {
    backgroundColor: '#6C5CE7',
    height: 24,
    marginTop: -12,
    width: 2,
  },
  tickAverage: {
    backgroundColor: '#FDCB6E',
    height: 20,
    marginTop: -10,
  },
  tickLabel: {
    position: 'absolute',
    bottom: -18,
    left: 0,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    width: 30,
    marginLeft: -15,
  },
  tickLabelHighlighted: {
    color: '#6C5CE7',
    fontWeight: '700',
  },
  tickLabelAverage: {
    color: '#FDCB6E',
    fontWeight: '600',
  },
  centerIndicator: {
    position: 'absolute',
    height: 40,
    width: 2,
    top: '50%',
    left: '50%',
    marginLeft: -1,
    marginTop: -20,
  },
  centerIndicatorArrow: {
    position: 'absolute',
    top: -5,
    left: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  averageMarker: {
    position: 'absolute',
    height: 30,
    width: 2,
    top: '50%',
    marginTop: -15,
  },
  averageLabel: {
    position: 'absolute',
    top: -20,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
    backgroundColor: '#FDCB6E',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    left: -10,
    width: 'auto',
    minWidth: 20,
  },
  averageArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -10,
  },
  averageArrowText: {
    fontSize: 12,
    fontWeight: '600',
  },
  minMaxLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  rangeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  button: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  revertButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  revertButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  doneButton: {
    backgroundColor: '#6C5CE7', // Match indicator color
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});