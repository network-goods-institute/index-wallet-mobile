import { Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { CircleCheck } from "lucide-react-native";
import { OnboardingIndicatorProps } from "./types";
import { Button } from "./Button";
import { Pagination } from "./Pagination";
import { FADE_IN, FADE_OUT, LAYOUT, PRIMARY_COLOR, GRAY_COLOR, SPACING } from "./constants";

export function OnboardingIndicator({
  data,
  onChange,
  selectedIndex,
}: OnboardingIndicatorProps) {
  return (
    <View style={{ gap: SPACING }}>
      <Pagination
        selectedIndex={selectedIndex}
        count={data.length}
        style={{ alignSelf: "center" }}
      />
      <View style={{ flexDirection: "row", gap: SPACING }}>
        {selectedIndex > 0 && (
          <Button
            style={{ backgroundColor: GRAY_COLOR }}
            onPress={() => {
              onChange(selectedIndex - 1);
            }}>
            <Text style={{ fontWeight: "600" }}>Back</Text>
          </Button>
        )}
        <Button
          style={{ backgroundColor: PRIMARY_COLOR, flex: 1 }}
          onPress={() => {
            if (selectedIndex === data.length - 1) {
              return;
            }
            onChange(selectedIndex + 1);
          }}>
          {selectedIndex === data.length - 1 ? (
            <Animated.View
              entering={FADE_IN}
              exiting={FADE_OUT}
              style={{
                flexDirection: "row",
                gap: SPACING / 2,
                alignItems: "center",
              }}>
              <Animated.View
                entering={ZoomIn.delay(100)
                  .springify()
                  .damping(18)
                  .stiffness(200)}>
                <CircleCheck color="white" size={18} />
              </Animated.View>
              <Text style={{ color: "white", fontWeight: "600" }}>
                Finished
              </Text>
            </Animated.View>
          ) : (
            <Animated.Text
              style={{ color: "white", fontWeight: "600" }}
              entering={FADE_IN}
              exiting={FADE_OUT}
              layout={LAYOUT}>
              Continue
            </Animated.Text>
          )}
        </Button>
      </View>
    </View>
  );
}
