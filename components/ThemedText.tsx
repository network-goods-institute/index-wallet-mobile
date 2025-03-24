import { Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  className?: string;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  className,
  ...rest
}: ThemedTextProps) {
  // Define base classes for text types
  let typeClasses = '';
  
  switch (type) {
    case 'default':
      typeClasses = 'text-base leading-6';
      break;
    case 'defaultSemiBold':
      typeClasses = 'text-base leading-6 font-semibold';
      break;
    case 'title':
      typeClasses = 'text-3xl font-bold leading-8';
      break;
    case 'subtitle':
      typeClasses = 'text-lg leading-6 font-medium';
      break;
    case 'link':
      typeClasses = 'text-base leading-6 text-blue-600 dark:text-blue-400';
      break;
  }
  
  // Default text color classes
  const colorClasses = 'text-black dark:text-white';
  
  // Combine all classes
  const combinedClassName = className 
    ? `${colorClasses} ${typeClasses} ${className}` 
    : `${colorClasses} ${typeClasses}`;

  return (
    <Text
      className={combinedClassName}
      style={style}
      {...rest}
    />
  );
}


