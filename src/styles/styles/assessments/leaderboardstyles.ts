import { StyleSheet } from "react-native";

const BG = "#EEEFF5";

export const leaderboardStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },

  // Header is its own white rounded card, not a bare bar on the background.
  headerCard: {
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 24,
    height: 24,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "800", color: "#1A1A2E" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },

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
    borderColor: "#6C63FF",
    backgroundColor: "#F4F9FF",
  },

  rankWrap: { width: 16, alignItems: "center", justifyContent: "center" },
  rankNum: { fontSize: 12, fontWeight: "800", color: "#6C63FF" },

  avatar: {
    width: 26,
    height: 26,
    borderRadius: 17,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },

  name: { flex: 1, fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  pct: { fontSize: 14, fontWeight: "800", color: "#F2784B" },
});

export const leaderboardExtraStyles = StyleSheet.create({
  // Breadcrumb (optional — only rendered when assessmentName/liveLabel are passed in)
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingTop: 4,
    paddingLeft: 44, // aligns under the title, past the circular back button
  },
  breadcrumbText: { fontSize: 12, fontWeight: "600", color: "#9CA3AF" },
  breadcrumbActive: { color: "#6C63FF" },

  // Podium
  podiumWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 10,
  },
  podiumCol: { flex: 1, alignItems: "center", maxWidth: 90 },
  podiumAvatar: {
    width: 42,
    height: 42,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  podiumAvatarLg: { width: 54, height: 54, borderRadius: 32 },
  podiumAvatarText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  podiumAvatarTextLg: { fontSize: 16 },
  podiumName: { fontSize: 12, fontWeight: "700", color: "#1A1A2E" },
  podiumPct: { fontSize: 10, fontWeight: "700", color: "#9CA3AF", marginBottom: 8 },
  podiumBlock: {
    width: "90%",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 10,
  },
  podiumBlockNum: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },

  // Your rank card
  yourCardWrap: { paddingHorizontal: 16, marginBottom: 10 },
  yourCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5B4FE0",
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  yourAvatar: {
    width: 24,
    height: 24,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  yourAvatarText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  yourRankNum: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  yourLabel: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  yourMeta: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 },
  // yourXpBadge: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 4,
  //   backgroundColor: "rgba(255,255,255,0.16)",
  //   borderRadius: 20,
  //   paddingHorizontal: 10,
  //   paddingVertical: 6,
  // },
  // yourXpText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },

  // "TOP RANKS" section
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionLabel: { fontSize: 12, fontWeight: "800", color: "#9CA3AF", letterSpacing: 0.6 },
  sectionCaption: { fontSize: 12, color: "#9CA3AF" },
});