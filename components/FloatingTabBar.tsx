import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Animated, Platform, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Home, TrendingUp, ArrowLeftRight, Settings, ShoppingBag } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const FloatingTabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation }) => {
  const { colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  
  // Animation values for each tab
  const animatedValues = useRef(
    state.routes.map(() => new Animated.Value(0))
  ).current;
  
  // Scale animation for active tab
  const scaleValues = useRef(
    state.routes.map(() => new Animated.Value(1))
  ).current;
  
  // Pulse animation for transact button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate the active tab
    animatedValues.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: state.index === index ? 1 : 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }).start();
      
      // Don't scale the transact button
      if (state.routes[index].name !== 'transact') {
        Animated.spring(scaleValues[index], {
          toValue: state.index === index ? 1.1 : 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }).start();
      }
    });
    
    // Pulse animation for transact button when selected
    const transactIndex = state.routes.findIndex((r: any) => r.name === 'transact');
    if (state.index === transactIndex) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.index]);

  const getIcon = (routeName: string, isFocused: boolean, isTransact: boolean = false) => {
    const iconSize = isTransact ? 28 : 24;
    const iconColor = isTransact 
      ? '#FFFFFF'
      : isFocused 
        ? (isDark ? '#FBBF24' : '#F59E0B') // Index Wallets yellow
        : (isDark ? '#94A3B8' : '#64748B');

    switch (routeName) {
      case 'index':
        return <Home size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'valuations':
        return <TrendingUp size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'transact':
        return <ArrowLeftRight size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'vendors':
        return <ShoppingBag size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'settings':
        return <Settings size={iconSize} color={iconColor} strokeWidth={2.5} />;
      default:
        return null;
    }
  };

  const handlePress = (route: any, isFocused: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Center button - rendered outside tab bar to avoid clipping */}
      <View style={styles.centerButtonWrapper}>
        {state.routes.map((route: any, index: number) => {
          if (route.name !== 'transact') return null;
          
          const isFocused = state.index === index;
          
          return (
            <Animated.View
              key={route.key}
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <TouchableOpacity
                onPress={() => handlePress(route, isFocused)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#F59E0B', '#FB923C']} // Always orange gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.centerButton,
                    {
                      shadowColor: '#F59E0B',
                      shadowOpacity: 0.4,
                    }
                  ]}
                >
                  <Animated.View
                    style={{
                      transform: [{
                        scale: animatedValues[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        })
                      }],
                    }}
                  >
                    {getIcon(route.name, isFocused, true)}
                  </Animated.View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
      
      {/* Main tab bar */}
      <View style={styles.tabBarContainer}>
        <BlurView
          intensity={60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.blurView,
            { backgroundColor: isDark ? 'rgba(17, 24, 39, 0.5)' : 'rgba(255, 255, 255, 0.5)' }
          ]}
        >
          <View style={styles.tabBar}>
            {state.routes.map((route: any, index: number) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const isTransact = route.name === 'transact';

              if (isTransact) {
                // Render empty space for center button
                return <View key={route.key} style={styles.centerSpace} />;
              }

              // Render regular tab
              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={() => handlePress(route, isFocused)}
                  style={styles.tab}
                >
                  <Animated.View
                    style={[
                      styles.tabContent,
                      {
                        transform: [{ scale: scaleValues[index] }],
                      }
                    ]}
                  >
                    {getIcon(route.name, isFocused)}
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  blurView: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonWrapper: {
    position: 'absolute',
    left: '50%',
    bottom: 40, // Position above tab bar
    marginLeft: -32,
    zIndex: 10,
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerSpace: {
    flex: 1,
  },
});

export default FloatingTabBar;