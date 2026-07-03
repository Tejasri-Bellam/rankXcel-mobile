import { StyleSheet } from "react-native";
import { COLORS } from "@/src/styles/styles";


export const practiceScreenStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F8FC" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#F7F8FC",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 18,
  },
  cardList: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // Subject card
  subjectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  subjectNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  subjectName: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  subjectMeta: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },

  nodeInfo: { flex: 1 },

  // Drill-down header
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#F7F8FC",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 15, fontWeight: "600", color: '#6C63FF' },
  bigTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
    backgroundColor: "#F7F8FC",
  },
  screenContent: { paddingHorizontal: 16, paddingBottom: 32 },

  // Stat banner
  banner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerInfo: { flex: 1 },
  bannerStatus: { fontSize: 17, fontWeight: "800", color: "#1A1A2E" },
  bannerMeta: { fontSize: 13, color: "#9CA3AF", marginTop: 3 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#AAAAAA",
    letterSpacing: 1,
    paddingHorizontal: 4,
    marginTop: 22,
    marginBottom: 8,
  },

  // List card (topics / sub-topics)
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listRowLast: { borderBottomWidth: 0 },
  listInfo: { flex: 1 },
  listName: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  listMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 3 },
  square: { width: 26, height: 26, borderRadius: 8 },

  // Leaf-row action cluster (play = practice, file = test)
  rowActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  testBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  // Practice-all bar
  practiceAllBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginTop: 16,
  },
  practiceAllLabel: { flex: 1, fontSize: 15, fontWeight: "700", color: "#fff" },
  practiceAllActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  // States
  centered: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#9CA3AF" },
  errorText: { fontSize: 14, color: "#EF4444", textAlign: "center" },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});
