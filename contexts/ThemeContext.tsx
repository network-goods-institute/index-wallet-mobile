import React, { createContext, useContext, useEffect } from 'react';
import { colorScheme as nativeWindColorScheme } from 'nativewind';

interface ThemeContextType {
  colorScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always use light mode
  const colorScheme = 'light';
    
  // Set NativeWind to always use light mode
  useEffect(() => {
    nativeWindColorScheme.set('light');
  }, []);
  
  return (
    <ThemeContext.Provider value={{ colorScheme }}>
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
