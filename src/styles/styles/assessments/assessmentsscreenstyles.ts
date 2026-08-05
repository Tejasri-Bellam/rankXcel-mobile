import { StyleSheet } from "react-native";

const BG = "#F7F8FC";

export const liveTestsStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  // Title on the left, the status filter button pinned to its right.
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pageTitle: { fontSize: 30, fontWeight: "800", color: "#1A1A2E" },
  // Server-reported total for the active status filter.
  titleCount: {
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6C63FF",
  },
  titleCountText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  pageSubtitle: { fontSize: 14, color: "#9CA3AF", lineHeight: 20 },

  // ── Status filter button + dropdown ──
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E5EE",
  },
  filterBtnOpen: { borderColor: "#6C63FF" },
  filterBtnText: { fontSize: 12, fontWeight: "700", color: "#4C6FD1" },

  dropdownBackdrop: { flex: 1 },
  dropdown: {
    position: "absolute",
    minWidth: 150,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E5EE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#D6D9E4",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: { backgroundColor: "#6C63FF", borderColor: "#6C63FF" },
  dropdownLabel: { flex: 1, fontSize: 12, fontWeight: "600", color: "#4C6FD1" },
  dropdownLabelActive: { color: "#6C63FF", fontWeight: "800" },
  dropdownCount: { fontSize: 11, fontWeight: "700", color: "#9CA3AF" },

  cardList: { paddingHorizontal: 16, gap: 12 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLive: {
    borderWidth: 1.3,
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
  statusPillText: { fontSize: 10, fontWeight: "700" },
  liveDot: { width: 4, height: 4, borderRadius: 3, backgroundColor: "#EF4444" },
  participants: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },

  cardTitle: { fontSize: 14, fontWeight: "800", color: "#1A1A2E", marginBottom: 6 },
  cardMeta: { fontSize: 12, color: "#9CA3AF" },

  // ── In-progress (resumable) attempt ──
  inProgressPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#FFECEC",
  },
  inProgressPillText: { fontSize: 10, fontWeight: "800", color: "#EF4444" },
  resumeCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#6C63FF",
  },
  resumeCardBtnText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },

  studentStatusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  studentStatusText: { fontSize: 11, fontWeight: "700" },

  centered: { alignItems: "center", paddingTop: 80 },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },

  loadMoreBtn: {
  marginTop: 8,
  marginBottom: 8,
  alignSelf: 'center',
  paddingVertical: 8,
  paddingHorizontal: 18,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFFFFF',
  borderWidth: 1.5,
  borderColor: '#6C63FF',
},

loadMoreText: {
  fontSize: 13,
  fontWeight: '700',
  color: '#6C63FF',
},

loadMoreSpinner: {
  marginTop: 8,
  marginBottom: 8,
  alignSelf: 'center',
  paddingVertical: 10,
  alignItems: 'center',
  justifyContent: 'center',
},

});
