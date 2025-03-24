import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_PREFERENCE_KEY = 'theme_preference';

type ThemePreference = 'light' | 'dark' | 'system';

export function useAppTheme() {
  const deviceTheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  
  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedPreference && (savedPreference === 'light' || savedPreference === 'dark' || savedPreference === 'system')) {
          setThemePreference(savedPreference as ThemePreference);
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Save theme preference whenever it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem(THEME_PREFERENCE_KEY, themePreference);
      } catch (error) {
        console.error('Failed to save theme preference', error);
      }
    };
    
    saveThemePreference();
  }, [themePreference]);
  
  // Calculate the actual theme to use based on preference
  const actualTheme = themePreference === 'system' 
    ? deviceTheme || 'light' 
    : themePreference;
  
  // Function to toggle between light and dark
  const toggleTheme = () => {
    setThemePreference(actualTheme === 'dark' ? 'light' : 'dark');
  };
  
  // Function to set theme preference
  const setTheme = (preference: ThemePreference) => {
    setThemePreference(preference);
  };
  
  return {
    theme: themePreference,
    colorScheme: actualTheme,
    toggleTheme,
    setTheme,
    isSystemTheme: themePreference === 'system'
  };
}
