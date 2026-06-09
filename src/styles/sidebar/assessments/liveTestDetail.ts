import { StyleSheet } from "react-native";

const BG = "#EEEFF5";
const ACCENT = "#2F86FF";

export const liveTestDetailStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start" },
  backText: { fontSize: 16, fontWeight: "600", color: "#3B82F6" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },

  kicker: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 10,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusPillText: { fontSize: 12, fontWeight: "700" },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#EF4444" },

  title: { fontSize: 26, fontWeight: "800", color: "#1A1A2E", marginBottom: 10 },
  description: { fontSize: 14, color: "#6B7280", lineHeight: 21, marginBottom: 20 },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1A1A2E" },
  infoValue: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#F0F1F5" },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  registeredBtn: {
    backgroundColor: "#EAF1FF",
    shadowOpacity: 0,
    elevation: 0,
  },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
});
