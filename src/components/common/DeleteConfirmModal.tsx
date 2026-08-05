import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onDelete: () => void;
};

export default function DeleteConfirmModal({
  visible,
  onCancel,
  onDelete,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Ionicons name="trash-outline" size={32} color="#EF4444" />
          </View>

          <Text style={styles.title}>Delete Notification?</Text>

          <Text style={styles.description}>
            This notification will be permanently removed.
            {"\n"}
            This action cannot be undone.
          </Text>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onDelete}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modal: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
  },

  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  description: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    marginBottom: 28,
  },

  footer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  deleteText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});