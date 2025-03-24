import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme as nativeWindColorScheme, useColorScheme } from 'nativewind';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  colorScheme: 'light' | 'dark';
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'user-theme-preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  
  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
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
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (error) {
        console.error('Failed to save theme preference', error);
      }
    };
    
    saveThemePreference();
  }, [theme]);
  
  // Determine the actual color scheme based on theme setting
  const colorScheme = theme === 'system' 
    ? deviceColorScheme || 'light' 
    : theme;
    
  // Update NativeWind's color scheme whenever our colorScheme changes
  useEffect(() => {
    nativeWindColorScheme.set(colorScheme);
  }, [colorScheme]);
  
  // Set theme function
  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };
  
  // Toggle between light and dark (ignoring system)
  const toggleTheme = () => {
    if (colorScheme === 'light') {
      setThemeState('dark');
    } else {
      setThemeState('light');
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme, colorScheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
