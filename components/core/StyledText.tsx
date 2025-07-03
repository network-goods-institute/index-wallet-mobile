import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { typography, fontWeight, fontFamily, fontSize } from '@/utils/typography';

interface StyledTextProps extends TextProps {
  variant?: keyof typeof typography;
  weight?: 'regular' | 'medium' | 'bold';
  size?: keyof typeof fontSize;
}

export function StyledText({ 
  variant = 'body1',
  weight,
  size,
  style,
  children,
  ...props
}: StyledTextProps) {
  // Get base styles from typography
  const baseStyles = {...typography[variant]};
  
  // Override with custom weight if specified
  if (weight) {
    baseStyles.fontFamily = fontFamily[weight];
    baseStyles.fontWeight = fontWeight[weight];
  }
  
  // Override with custom size if specified
  if (size) {
    baseStyles.fontSize = fontSize[size];
  }
  
  return (
    <Text style={[baseStyles, style]} {...props}>
      {children}
    </Text>
  );
}
