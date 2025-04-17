import { View } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle } from "react-native-reanimated";
import { DotProps } from "./types";
import { ACTIVE_DOT_COLOR, DOT_CONTAINER, DOT_SIZE, INACTIVE_DOT_COLOR } from "./constants";

export function Dot({ index, animation }: DotProps) {
  const stylez = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        animation.value,
        [index - 1, index, index + 1],
        [INACTIVE_DOT_COLOR, ACTIVE_DOT_COLOR, ACTIVE_DOT_COLOR]
      ),
    };
  });

  return (
    <View
      style={{
        width: DOT_CONTAINER,
        aspectRatio: 1,
        borderRadius: DOT_CONTAINER,
        justifyContent: "center",
        alignItems: "center",
      }}>
      <Animated.View
        style={[
          {
            backgroundColor: INACTIVE_DOT_COLOR,
            width: DOT_SIZE,
            aspectRatio: 1,
            borderRadius: DOT_SIZE,
          },
          stylez,
        ]}
      />
    </View>
  );
}
