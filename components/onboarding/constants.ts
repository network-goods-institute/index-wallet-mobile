import { FadeInDown, FadeInLeft, FadeOutLeft, FadeOutUp, LinearTransition } from "react-native-reanimated";

// Constants
export const BUTTON_HEIGHT = 42;
export const SPACING = 10;
export const DOT_CONTAINER = 24;
export const DOT_SIZE = DOT_CONTAINER / 3;

// Colors
export const ACTIVE_DOT_COLOR = "#fff";
export const INACTIVE_DOT_COLOR = "#aaa";
export const PRIMARY_COLOR = "#036BFB";
export const SUCCESS_COLOR = "#29BE56";
export const GRAY_COLOR = "#ddd";

// Animations
export const FADE_IN = FadeInDown.springify().damping(18).stiffness(200);
export const FADE_OUT = FadeOutUp.springify().damping(18).stiffness(200);
export const LAYOUT = LinearTransition.springify().damping(18).stiffness(200);
export const SLIDE_IN = FadeInLeft.springify().damping(18).stiffness(200);
export const SLIDE_OUT = FadeOutLeft.springify().damping(18).stiffness(200);
