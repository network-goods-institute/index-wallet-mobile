import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { OnboardingIndicator } from '@/components/onboarding';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { X } from 'lucide-react-native';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const slides = [
  {
    title: 'Donate to Causes You Care About',
    description: 'Support causes like reforestation or community projects and receive digital donation receipts in your Index Wallets.',
    animation: require('@/assets/animations/2.json'),
  },
  {
    title: 'Shop and Save Automatically',
    description: 'Use your donation receipts at participating merchants - they reduce your purchase price based on how much the merchant values your cause.',
    animation: require('@/assets/animations/3.json'),
  },
  {
    title: 'Compare and Choose Values-Aligned Vendors',
    description: 'See real-time price comparisons showing how much you save at different merchants based on their values alignment with your donations.',
    animation: require('@/assets/animations/4.json'),
  },
];

export default function CustomerSlides() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { setOnboardingStep } = useAuth();
  const { colorScheme } = useTheme();

  const handleChange = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={() => setOnboardingStep('user-type')}
        >
          <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Animated.View 
            key={selectedIndex}
            entering={FadeInRight.springify().damping(18).stiffness(200)}
            exiting={FadeOutLeft.springify().damping(18).stiffness(200)}
            style={styles.slide}
          >
            <LottieView
              source={slides[selectedIndex].animation}
              autoPlay
              loop
              style={styles.animation}
            />
            <Text style={styles.title} className="text-black dark:text-white">
              {slides[selectedIndex].title}
            </Text>
            <Text style={styles.description} className="text-gray-600 dark:text-gray-400">
              {slides[selectedIndex].description}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <OnboardingIndicator
            data={[...Array(slides.length).keys()]}
            selectedIndex={selectedIndex}
            onChange={handleChange}
            onComplete={() => setOnboardingStep('user-name')}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(isWeb && {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
    }),
  },
  safeArea: {
    flex: 1,
    ...(isWeb && {
      maxWidth: 480,
      width: '100%',
      maxHeight: 800,
      backgroundColor: 'white',
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      margin: 20,
    }),
  },
  exitButton: {
    position: 'absolute',
    top: isWeb ? 20 : 60,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isWeb ? 40 : 20,
  },
  slide: {
    width: isWeb ? '100%' : width - 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: isWeb ? 280 : 200,
    height: isWeb ? 280 : 200,
    marginBottom: isWeb ? 32 : 24,
  },
  title: {
    fontSize: isWeb ? 28 : 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    ...(isWeb && {
      maxWidth: 400,
    }),
  },
  description: {
    fontSize: isWeb ? 16 : 18,
    textAlign: 'center',
    marginBottom: 24,
    ...(isWeb && {
      maxWidth: 360,
      lineHeight: 24,
    }),
  },
  footer: {
    paddingHorizontal: isWeb ? 40 : 20,
    paddingBottom: 40,
  },
});
