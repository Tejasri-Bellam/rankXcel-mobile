import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Renders the confirm button in a red destructive style. */
  destructive?: boolean;
  /** Shows a spinner on the confirm button and disables it. */
  loading?: boolean;
  /** Optional icon shown next to the confirm label. */
  confirmIcon?: keyof typeof Ionicons.glyphMap;
};

/**
 * A reusable bottom-sheet confirmation dialog, styled after the exam submit
 * sheets. Replaces Alert.alert for submit/exit confirmations so the app has one
 * consistent, on-brand confirmation UI. Tapping the dimmed overlay cancels.
 */
export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
  loading = false,
  confirmIcon,
}: ConfirmModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={loading ? undefined : onCancel}
      >
        {/* Stop taps inside the sheet from dismissing it. */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{message}</Text>
          <View style={styles.btns}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                  {confirmIcon ? (
                    <Ionicons name={confirmIcon} size={16} color="#fff" />
                  ) : null}
                </>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#1A1A2E", marginBottom: 10 },
  desc: { fontSize: 14, color: "#6B7280", lineHeight: 22, marginBottom: 24 },
  btns: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelText: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    paddingVertical: 15,
  },
  confirmBtnDestructive: { backgroundColor: "#DC2626" },
  confirmText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
