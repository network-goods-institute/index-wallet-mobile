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
    title: 'Accept Value-Based Payments',
    description: 'Join IndexWallets to accept customer donation receipts as partial payment, enabling 0% transaction fees while attracting values-aligned customers.',
  },
  {
    title: 'Value What Your Customers Value',
    description: 'Set your acceptance rate for causes your customers care about - the more you value their donations, the more business you attract.',
  },
  {
    title: 'Grow Through Community Alignment',
    description: 'Watch your business grow as customers choose you over competitors because it\'s literally cheaper for them to buy from values-aligned vendors.',
  },
];

export default function VendorSlides() {
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
