import { StyleSheet } from "react-native";

const BG = "#EEEFF5";

export const liveTestsStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  pageTitle: { fontSize: 30, fontWeight: "800", color: "#1A1A2E", marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: "#9CA3AF", lineHeight: 20 },

  filterRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E5EE",
  },
  chipActive: { backgroundColor: "#2F86FF", borderColor: "#2F86FF" },
  chipText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },
  chipTextActive: { color: "#FFFFFF" },
  chipBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF0F5",
  },
  chipBadgeActive: { backgroundColor: "rgba(255,255,255,0.28)" },
  chipBadgeText: { fontSize: 11, fontWeight: "800", color: "#6B7280" },
  chipBadgeTextActive: { color: "#FFFFFF" },

  cardList: { paddingHorizontal: 16, gap: 12 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLive: {
    borderWidth: 1.5,
    borderColor: "#F2A29A",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: { fontSize: 12, fontWeight: "700" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444" },
  participants: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },

  cardTitle: { fontSize: 17, fontWeight: "800", color: "#1A1A2E", marginBottom: 6 },
  cardMeta: { fontSize: 13, color: "#9CA3AF" },

  centered: { alignItems: "center", paddingTop: 80 },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
});
