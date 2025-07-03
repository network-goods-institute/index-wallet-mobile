import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  className?: string;
};

export function ThemedView({ style, className, ...otherProps }: ThemedViewProps) {
  const defaultClassName = 'bg-white';
  const combinedClassName = className ? `${defaultClassName} ${className}` : defaultClassName;
  
  return <View className={combinedClassName} style={style} {...otherProps} />;
}
