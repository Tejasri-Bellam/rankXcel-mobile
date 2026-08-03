import React from "react";
import {
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { BRAND } from "@/src/libs/constants";
import { COLORS } from "@/src/styles/styles";

// The RankXcel mark — bolt badge + wordmark. Shared by the landing header, the
// login/signup screens and the in-app header so they can't drift apart.

interface Props {
  // Makes the mark tappable (e.g. "back to the landing page"). Rendered as a
  // plain View when omitted.
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function BrandLogo({ onPress, style }: Props) {
  const content = (
    <>
      <View style={styles.icon}>
        <Text style={styles.iconText}>⚡</Text>
      </View>
      <Text style={styles.text}>{BRAND}</Text>
    </>
  );

  if (!onPress) return <View style={[styles.row, style]}>{content}</View>;

  return (
    <TouchableOpacity
      style={[styles.row, style]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={BRAND}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles: any = {
  // No alignSelf here — inside the row-direction headers that would push the
  // mark to the top. Column callers (the auth screens) pass it themselves to
  // keep the tap target off the empty space beside the wordmark.
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: COLORS.white, fontSize: 15 },
  text: { fontSize: 18, fontWeight: "700", color: COLORS.textDark },
};
