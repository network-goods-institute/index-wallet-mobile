import '../polyfills'; // Import Buffer polyfill

import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '@/contexts/ThemeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth, AuthStatus, OnboardingStep } from '@/contexts/AuthContext';
import { BalanceProvider } from '@/contexts/BalanceContext';
import '../global.css';

import WelcomeScreen from '../app/auth/welcome';
import OnboardingFlow from '@/components/OnboardingFlow';
import { WalletDebugger } from '@/components/WalletDebugger';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'SF-Pro-Display': require('../assets/fonts/SF-Pro-Display-Regular.otf'),
    'SF-Pro-Display-Medium': require('../assets/fonts/SF-Pro-Display-Medium.otf'),
    'SF-Pro-Display-Bold': require('../assets/fonts/SF-Pro-Display-Bold.otf'),
    'SF-Pro-Rounded': require('../assets/fonts/SF-Pro-Rounded-Regular.otf'),
    'SF-Pro-Rounded-Medium': require('../assets/fonts/SF-Pro-Rounded-Medium.otf'),
    'SF-Pro-Rounded-Bold': require('../assets/fonts/SF-Pro-Rounded-Bold.otf'),
    'SF-Pro-Rounded-Black': require('../assets/fonts/SF-Pro-Rounded-Black.otf'),
  });
  
  useEffect(() => {
    if (error) {
      console.error('Error loading fonts:', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <BalanceProvider>
            <AppContent />
          </BalanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// Loading screen component
function LoadingScreen() {
  const { colorScheme } = useTheme();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#000' }}>Loading...</Text>
    </View>
  );
}

// Authenticated app component
function AuthenticatedApp() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

// Main app content component
function AppContent() {
  const { colorScheme } = useTheme();
  const { status, onboardingStep } = useAuth();
  
  // Render the appropriate component based on auth status
  function renderByAuthStatus(status: AuthStatus) {
    switch (status) {
      case 'loading':
        return <LoadingScreen />;
      case 'onboarding':
        return <OnboardingFlow step={onboardingStep} />;
      case 'unauthenticated':
        return <WelcomeScreen />;
      case 'authenticated':
        return <AuthenticatedApp />;
    }
  }
  
  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {renderByAuthStatus(status)}
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {status === 'authenticated' && <WalletDebugger />}
    </NavigationThemeProvider>
  );
}
