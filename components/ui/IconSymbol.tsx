// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'gearshape.fill': 'settings',
  'sun.max.fill': 'light_mode',
  'moon.fill': 'dark_mode',
  'faceid': 'face',
  'lock.fill': 'lock',
  'bell.fill': 'notifications',
  'info.circle.fill': 'info',
  'doc.text.fill': 'description',
  'shield.fill': 'shield',
  'chart.line.uptrend.xyaxis': 'trending_up',
};

export type IconSymbolName = keyof typeof MAPPING;
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Type assertion to handle the mapping safely
  const materialIconName = MAPPING[name] as MaterialIconName;
  return <MaterialIcons color={color} size={size} name={materialIconName} style={style as any} />;
}
