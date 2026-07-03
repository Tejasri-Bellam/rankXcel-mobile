import { StyleSheet } from "react-native";

export const practiceSettingsModalStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  topBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 0,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: '#6C63FF',
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1A2E",
    marginTop: 10,
    marginBottom: 20,
  },

  playBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  description: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 18,
  },
  bold: {
    fontWeight: "700",
    color: "#1A1A2E",
  },

  badgesRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 28,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgeGreen: { backgroundColor: "#DCFCE7" },
  badgeBlue: { backgroundColor: "#DBEAFE" },
  badgeGray: { backgroundColor: "#F3F4F6" },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#AAAAAA",
    letterSpacing: 1,
    marginBottom: 10,
  },

  qCountRow: {
    flexDirection: "row",
    gap: 12,
  },
  qBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  qBtnActive: {
    borderColor: "#6C63FF",
    backgroundColor: "#EEF4FF",
  },
  qBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  qBtnTextActive: {
    color: "#6C63FF",
  },

  diffRow: {
    flexDirection: "row",
    gap: 8,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  diffBtnActive: {
    backgroundColor: "#1A1A2E",
    borderColor: "#1A1A2E",
  },
  diffText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  diffTextActive: {
    color: "#FFFFFF",
  },

  errorText: {
    marginTop: 16,
    fontSize: 13,
    color: "#EF4444",
    textAlign: "center",
  },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  prevBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  prevBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: '#6C63FF',
  },
  startBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 16,
  },
  startBtnDisabled: {
    opacity: 0.6,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
