import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { OnboardingIndicator } from '@/components/onboarding';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Welcome to Index Business',
    description: 'Accept crypto payments seamlessly in your business',
  },
  {
    title: 'Easy Integration',
    description: 'Set up payment terminals and QR codes in minutes',
  },
  {
    title: 'Real-time Settlement',
    description: 'Get instant confirmations and automatic conversions',
  },
  {
    title: 'Start Accepting Payments',
    description: 'Create your business wallet to begin',
  },
];

export default function VendorSlides() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { setOnboardingStep } = useAuth();

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
