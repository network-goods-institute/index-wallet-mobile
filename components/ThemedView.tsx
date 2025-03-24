import { View, type ViewProps } from 'react-native';
import { useColorScheme } from 'nativewind';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  className?: string;
};

export function ThemedView({ style, lightColor, darkColor, className, ...otherProps }: ThemedViewProps) {
  const defaultClassName = 'bg-white dark:bg-black';
  const combinedClassName = className ? `${defaultClassName} ${className}` : defaultClassName;
  
  return <View className={combinedClassName} style={style} {...otherProps} />;
}
