import React, { useEffect, useRef } from 'react';
import { Image, TouchableOpacity, SafeAreaView, Text, View, StyleSheet, Dimensions, Animated } from 'react-native';
import { ThemedView } from '@/components/core/ThemedView';
import { StyledText } from '@/components/core/StyledText';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const GridBackground = ({ color }: { color: string }) => {
  const gridSize = 30;
  const strokeWidth = 0.5;
  
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        {/* Vertical lines */}
        {Array.from({ length: Math.ceil(width / gridSize) }).map((_, i) => (
          <Path
            key={`v-${i}`}
            d={`M ${i * gridSize} 0 L ${i * gridSize} ${height}`}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={0.15}
          />
        ))}
        {/* Horizontal lines */}
        {Array.from({ length: Math.ceil(height / gridSize) }).map((_, i) => (
          <Path
            key={`h-${i}`}
            d={`M 0 ${i * gridSize} L ${width} ${i * gridSize}`}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={0.15}
          />
        ))}
      </Svg>
    </View>
  );
};

const WelcomeScreen = () => {
  const { startOnboarding, setOnboardingStep } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleCreateWallet = () => {
    startOnboarding();
    setOnboardingStep('user-type');
  };

  const handleImportWallet = () => {
    startOnboarding();
    setOnboardingStep('import-seed');
  };
  
  return (
    <ThemedView className="flex-1">
      <GridBackground color={isDark ? '#FFFFFF' : '#000000'} />
      <SafeAreaView className="flex-1 mx-12 p-6 justify-center">
        <View className="my-48 items-center">
          <Animated.View
            style={{
              transform: [{ translateY: bounceAnim }],
            }}
          >
            <Image
              source={require('@/assets/images/Logo.png')}
              className="w-50 h-50 mb-12"
            />
          </Animated.View>

          <Text 
            className="text-5xl font-black text-center text-yellow-500 dark:text-yellow-400 mt-8"
            style={{ 
              fontFamily: 'SF-Pro-Rounded-Black'
            }}
          >
            Index Wallets
          </Text>
        </View>

        <View className="flex-1 justify-end">
          <View className="gap-4">
            <TouchableOpacity 
              className="bg-yellow-500 dark:bg-yellow-400 py-4 px-6 rounded-xl items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
              onPress={handleCreateWallet}
            >
              <Text 
                className="text-base font-semibold text-white"
                style={{ fontFamily: 'SF-Pro-Rounded-Bold' }}
              >
                Create a New Wallet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-white dark:bg-gray-800 border-2 border-yellow-500 dark:border-yellow-400 py-4 px-6 rounded-xl items-center"
              onPress={handleImportWallet}
            >
              <Text 
                className="text-base font-semibold text-yellow-600 dark:text-yellow-400"
                style={{ fontFamily: 'SF-Pro-Rounded-Bold' }}
              >
                Import Existing Wallet
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-12">
          <StyledText 
            variant="caption" 
            className="text-xs font-light text-center text-gray-500 dark:text-gray-400"
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </StyledText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};

export default WelcomeScreen;