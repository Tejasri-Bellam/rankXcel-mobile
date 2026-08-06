import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// How much of the app's layout the software keyboard currently covers, in dp
// (0 while it is closed). Screens pad their bottom by this so a focused input
// (the numeric answer field on exams) stays above the keyboard.
//
// Why not KeyboardAvoidingView: the app runs edge-to-edge on Android
// (`edgeToEdgeEnabled` in app.config.ts), and there the window is no longer
// resized when the keyboard opens — `adjustResize` in the manifest is a no-op,
// so the layout stays put and the keyboard simply draws over the bottom of the
// screen. KeyboardAvoidingView has nothing to react to on that path, which is
// why the numeric input sat behind the keyboard.
export function useKeyboardOverlap() {
  const insets = useSafeAreaInsets();
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    // iOS fires the "will" events alongside the keyboard's own animation, so
    // the layout moves with it instead of snapping after it settles. Android
    // only has the "did" events.
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvent, (e) => {
      // iOS measures the keyboard from the very bottom of the screen, and the
      // app shell already reserves the home-indicator strip below every screen
      // — that part isn't covering anything. Android's reported height already
      // excludes the system bars.
      const covered =
        e.endCoordinates.height - (Platform.OS === "ios" ? insets.bottom : 0);
      setOverlap(Math.max(0, covered));
    });
    const hide = Keyboard.addListener(hideEvent, () => setOverlap(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom]);

  return overlap;
}
