import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  BackHandler,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  // Fired when the popup finishes — either the auto-close timer elapses, the
  // "Go to Home" button is pressed, or the device back is used.
  onDone: () => void;
  // How long the popup stays up before redirecting. Defaults to 5s.
  autoCloseMs?: number;
}

// Success popup shown after an assessment is submitted. Auto-dismisses after
// `autoCloseMs` and calls `onDone` (the caller redirects to the home page).
export default function SubmitSuccessModal({
  visible,
  onDone,
  autoCloseMs = 5000,
}: Props) {
  // Keep the latest callback without resetting the timer on every re-render.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => onDoneRef.current(), autoCloseMs);
    // Android hardware back on the popup also finishes → redirect home.
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onDoneRef.current();
      return true;
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [visible, autoCloseMs]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => onDoneRef.current()}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>Assessment Submitted</Text>
          <Text style={styles.desc}>
            Your responses have been recorded successfully.
            {"\n"}Redirecting you to home…
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => onDoneRef.current()}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 17, 23, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
  },
  desc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#9898B0",
    textAlign: "center",
  },
  btn: {
    marginTop: 24,
    alignSelf: "stretch",
    backgroundColor: "#6C5CE7",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
