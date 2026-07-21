import { Dimensions, StyleSheet } from "react-native";
import { COLORS } from "@/src/styles/styles";

const HEAT_COLS = 7;
const HEAT_GAP = 6;
// Cell size derived from screen width: 16px screen padding + 18px card padding,
// both sides, leaving room for 7 cells and 6 gaps per row.
const HEAT_CELL = Math.floor(
  (Dimensions.get("window").width - 32 - 36 - HEAT_GAP * (HEAT_COLS - 1)) /
    HEAT_COLS
);

export const analyticsScreenStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  centered: { alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  pageTitle: { fontSize: 28, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },

  // ── Tab switcher ──
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#E9EBF2",
    borderRadius: 14,
    padding: 4,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: { fontSize: 14, fontWeight: "700", color: COLORS.textLight },
  tabTextActive: { color: COLORS.textDark },

  // ── Trends sub-filter (All / Mocks / Assessments) ──
  trendsFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  trendsFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trendsFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  trendsFilterText: { fontSize: 12, fontWeight: "700", color: COLORS.textLight },
  trendsFilterTextActive: { color: COLORS.white },

  // ── Heatmap tab ──
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  legendText: { fontSize: 12, color: COLORS.textLight, fontWeight: "600" },
  legendCell: { width: 18, height: 18, borderRadius: 5 },
  heatSubjectCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heatSubjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heatSubjectName: { fontSize: 15, fontWeight: "800", color: COLORS.textDark, flex: 1, marginRight: 12 },
  heatSubjectPct: { fontSize: 14, fontWeight: "800" },
  heatRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  heatRowCell: { width: 30, height: 30, borderRadius: 8 },

  // ── Trends tab ──
  trendTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  trendCaption: { fontSize: 12, color: COLORS.textMedium },
  trendPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  trendPillText: { fontSize: 10, fontWeight: "800" },

  gaugeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gaugePct: { fontSize: 30, fontWeight: "800", color: COLORS.textDark },
  gaugeLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.textLight,
    marginTop: 14,
  },
  gaugeSub: { fontSize: 14, color: COLORS.textMedium, marginTop: 6, textAlign: "center" },

  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "48.5%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: COLORS.textDark, marginTop: 10 },
  statLabel: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: { fontSize: 13, color: COLORS.textLight, textAlign: "center", paddingVertical: 8 },

  nodeRow: { marginBottom: 16 },
  nodeTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  nodeNameCol: { flex: 1, marginRight: 12 },
  nodeName: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  nodeSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  nodeRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  nodePct: { fontSize: 14, fontWeight: "800" },
  nodeBarBg: { height: 7, backgroundColor: "#EEF0F5", borderRadius: 5, overflow: "hidden" },
  nodeBarFill: { height: 7, borderRadius: 5 },

  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metric: { flex: 1, alignItems: "center", gap: 4 },
  metricValue: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  metricLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: "600" },
  metricDivider: { width: 1, height: 34, backgroundColor: COLORS.border },
  metricHr: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  heatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: HEAT_GAP,
  },
  heatCell: { width: HEAT_CELL, height: HEAT_CELL, borderRadius: 9 },
  heatLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  heatLabelText: { fontSize: 12, color: COLORS.textLight },
});
