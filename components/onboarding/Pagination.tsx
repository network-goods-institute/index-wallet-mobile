import { View } from "react-native";
import Animated, { useDerivedValue, withSpring } from "react-native-reanimated";
import { PaginationProps } from "./types";
import { Dot } from "./Dot";
import { PaginationIndicator } from "./PaginationIndicator";

export function Pagination({ count, selectedIndex, style }: PaginationProps) {
  const animation = useDerivedValue(() => {
    return withSpring(selectedIndex, {
      damping: 18,
      stiffness: 200,
    });
  });

  return (
    <View style={[{ flexDirection: "row" }, style]}>
      <PaginationIndicator animation={animation} />
      {[...Array(count).keys()].map((index) => (
        <Dot key={`dot-${index}`} index={index} animation={animation} />
      ))}
    </View>
  );
}
