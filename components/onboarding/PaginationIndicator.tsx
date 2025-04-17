import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { DOT_CONTAINER, SUCCESS_COLOR } from "./constants";

export function PaginationIndicator({
  animation,
}: {
  animation: SharedValue<number>;
}) {
  const stylez = useAnimatedStyle(() => {
    return {
      width: DOT_CONTAINER + DOT_CONTAINER * animation.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: DOT_CONTAINER,
          height: DOT_CONTAINER,
          borderRadius: DOT_CONTAINER,
          backgroundColor: SUCCESS_COLOR,
          position: "absolute",
          left: 0,
          top: 0,
        },
        stylez,
      ]}
    />
  );
}
