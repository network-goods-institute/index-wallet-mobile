// Typography utility for consistent font styling across the app

export const fontFamily = {
  // SF Pro Display fonts
  regular: 'SF-Pro-Display',
  medium: 'SF-Pro-Display-Medium',
  bold: 'SF-Pro-Display-Bold',
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  bold: "700" as const,
};

// Typography styles for common text elements
export const typography = {
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
  },
  h3: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.medium,
  },
  h4: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
  subtitle1: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  subtitle2: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  body1: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
  },
  body2: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
  },
  button: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  },
};
