import { Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { ButtonProps } from "./types";
import { BUTTON_HEIGHT, LAYOUT, SLIDE_IN, SLIDE_OUT, SPACING } from "./constants";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({ children, style, ...rest }: ButtonProps) {
  return (
    <AnimatedPressable
      style={[
        {
          height: BUTTON_HEIGHT,
          paddingHorizontal: SPACING * 2,
          justifyContent: "center",
          borderRadius: BUTTON_HEIGHT,
          alignItems: "center",
        },
        style,
      ]}
      entering={SLIDE_IN}
      exiting={SLIDE_OUT}
      layout={LAYOUT}
      {...rest}>
      {children}
    </AnimatedPressable>
  );
}
