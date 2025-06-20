import { PressableProps, ViewStyle } from "react-native";
import { AnimatedProps, SharedValue } from "react-native-reanimated";

export type ButtonProps = AnimatedProps<
  PressableProps & {
    style: ViewStyle;
  }
>;

export type OnboardingIndicatorProps = {
  data: number[];
  selectedIndex: number;
  onChange: (index: number) => void;
  onComplete?: () => void;
};

export type PaginationProps = {
  count: number;
  selectedIndex: number;
  style?: ViewStyle;
};

export type DotProps = {
  index: number;
  animation: SharedValue<number>;
};
