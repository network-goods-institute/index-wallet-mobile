import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions, StyleSheet, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { X } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function UserTypeScreen() {
  const { setOnboardingStep, setUserType } = useAuth();
  const { colorScheme } = useTheme();

  const handleContinue = () => {
    setUserType('customer');
    setOnboardingStep('customer-slides');
  };

  const handleBusinessSignup = () => {
    setUserType('vendor');
    setOnboardingStep('vendor-slides');
  };

  const handleBack = () => {
    setOnboardingStep('welcome');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={handleBack}
        >
          <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Animated.View 
            entering={FadeInRight.springify().damping(18).stiffness(200)}
            style={styles.slide}
          >
            <LottieView
              source={require('@/assets/animations/1.json')}
              autoPlay
              loop
              style={styles.animation}
            />
            <Text style={styles.title} className="text-black dark:text-white">
              Welcome to Index Wallets
            </Text>
            <Text style={styles.description} className="text-gray-600 dark:text-gray-400">
              Your gateway to values-aligned commerce
            </Text>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleContinue}
            className="bg-yellow-500 dark:bg-yellow-400 py-4 px-6 rounded-xl items-center w-full"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              marginBottom: 20,
            }}
            activeOpacity={0.8}
          >
            <Text 
              className="text-base font-semibold text-white"
              style={{ fontFamily: 'SF-Pro-Rounded-Bold' }}
            >
              Continue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBusinessSignup}
            style={styles.businessLink}
          >
            <Text style={styles.businessText} className="text-gray-500 dark:text-gray-400">
              I am signing up for a business
            </Text>
          </TouchableOpacity>
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
    left: 20,
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
    alignItems: 'center',
  },
  businessLink: {
    paddingVertical: 10,
  },
  businessText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
