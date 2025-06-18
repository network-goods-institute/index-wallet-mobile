import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { OnboardingIndicator } from '@/components/onboarding';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Welcome to Index Wallets',
    description: 'Your gateway to values-aligned commerce',
  },
  {
    title: 'Donate to Causes You Care About',
    description: 'Support causes like reforestation or community projects and receive digital donation receipts in your IndexWallet.',
  },
  {
    title: 'Shop and Save Automatically',
    description: 'Use your donation receipts at participating merchants - they reduce your purchase price based on how much the merchant values your cause.',
  },
  {
    title: 'Compare and Choose Values-Aligned Vendors',
    description: 'See real-time price comparisons showing how much you save at different merchants based on their values alignment with your donations.',
  },
];

export default function CustomerSlides() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { setOnboardingStep } = useAuth();
  const { colorScheme } = useTheme();

  const handleChange = (index: number) => {
    setSelectedIndex(index);
    if (index === slides.length - 1) {
      // Delay navigation to allow the animation to complete
      setTimeout(() => {
        setOnboardingStep('user-name');
      }, 1000);
    }
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
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  exitButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  slide: {
    width: width - 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
