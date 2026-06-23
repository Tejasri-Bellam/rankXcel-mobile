import { StyleSheet } from "react-native";

export const practiceProgressStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 3,
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    height: "100%",
    borderRadius: 2,
  },
  segmentActive: {
    flex: 1.4,
  },
});
