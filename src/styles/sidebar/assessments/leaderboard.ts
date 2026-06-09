import { StyleSheet } from "react-native";

const BG = "#EEEFF5";

export const leaderboardStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 16, paddingTop: 12 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start" },
  backText: { fontSize: 16, fontWeight: "600", color: "#3B82F6" },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  rowYou: {
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    backgroundColor: "#F4F9FF",
  },

  rankWrap: { width: 22, alignItems: "center", justifyContent: "center" },
  rankNum: { fontSize: 15, fontWeight: "700", color: "#9CA3AF" },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },

  name: { flex: 1, fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  pct: { fontSize: 15, fontWeight: "800", color: "#22C55E" },
});
