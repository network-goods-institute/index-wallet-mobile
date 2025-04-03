import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import '../global.css';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { colorScheme } = useTheme();
  const { status, onboardingStep } = useAuth();
  
  // Render different content based on authentication status
  const renderContent = () => {
    if (status === 'loading') {
      // Show a loading screen while checking auth status
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#000' }}>Loading...</Text>
        </View>
      );
    } else if (status === 'unauthenticated' || status === 'onboarding') {
      // Import auth screens dynamically to avoid circular dependencies
      const WelcomeScreen = require('../app/auth/welcome').default;
      const CreateWalletScreen = require('../app/auth/create-wallet').default;
      const ImportWalletScreen = require('../app/auth/import-wallet').default;
      const SecuritySettingsScreen = require('../app/auth/security-settings').default;
      
      // Show auth screens based on the current step
      if (status === 'onboarding') {
        switch (onboardingStep) {
          case 'create-seed':
            return <CreateWalletScreen />;
          case 'verify-seed':
            const VerifySeedScreen = require('../app/auth/verify-seed').default;
            return <VerifySeedScreen />;
          case 'import-seed':
            return <ImportWalletScreen />;
          case 'create-passkey':
            return <SecuritySettingsScreen />;
          case 'complete':
            // This would be implemented as needed
            return <CreateWalletScreen />;
          default:
            return <WelcomeScreen />;
        }
      } else {
        // Default to welcome screen for unauthenticated users
        return <WelcomeScreen />;
      }
    } else {
      // User is authenticated, show the main app
      return (
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      );
    }
  };
  
  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {renderContent()}
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
