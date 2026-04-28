import { Dimensions, StyleSheet } from 'react-native';
import { COLORS } from '../styles';
const { width, height } = Dimensions.get('window');

export const mockLibraryStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 40 },

  // Page header
  pageHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  pageSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 3 },
  requestBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  requestBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  // Search
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 14,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textDark, padding: 0 },

  // Tabs
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, marginTop: 14, gap: 8,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20, backgroundColor: COLORS.white,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium },
  tabTextActive: { color: COLORS.white },
  tabBadge: {
    backgroundColor: COLORS.red, borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  tabBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

  // Filter bar
  filterBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 14,
  },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  sortBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium },

  // Sort dropdown (inline)
  sortOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  sortDropdown: {
    position: 'absolute', right: 16, top: 130,
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 8,
    zIndex: 51, minWidth: 180,
  },
  sortOption: { paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sortOptionActive: { backgroundColor: COLORS.primaryLight },
  sortOptionText: { fontSize: 14, color: COLORS.textMedium, fontWeight: '500' },
  sortOptionTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Results count
  resultsCount: {
    fontSize: 13, fontWeight: '600', color: COLORS.textLight,
    paddingHorizontal: 16, marginTop: 14, marginBottom: 4,
  },

  // Mock Card
  mockCard: {
    backgroundColor: COLORS.white, borderRadius: 16,
    marginHorizontal: 16, marginTop: 12, padding: 16,
    shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 10, elevation: 2,
  },
  mockCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  examTag: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  examTagText: { fontSize: 12, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  mockTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 2 },
  mockSubject: { fontSize: 13, color: COLORS.textMedium, marginBottom: 10 },
  mockMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  mockMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mockMetaText: { fontSize: 12, color: COLORS.textLight },
  diffBadge: { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3, marginLeft: 'auto' },
  diffText: { fontSize: 12, fontWeight: '700' },

  // Stats row (completed)
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', color: COLORS.textDark },
  statLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },

  lastAttempt: { fontSize: 11, color: COLORS.textLight, marginTop: 10 },

  // Buttons
  resumeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 11, marginTop: 12,
  },
  resumeBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  startBtn: {
    backgroundColor: COLORS.primaryLight, borderRadius: 10,
    paddingVertical: 11, alignItems: 'center', marginTop: 12,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  startBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

  // Load more
  loadMoreBtn: {
    alignSelf: 'center', marginTop: 20,
    paddingHorizontal: 28, paddingVertical: 13,
    borderRadius: 25, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: COLORS.textMedium },

  // Filter Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  filterPanel: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: height * 0.8,
  },
  filterPanelTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textDark, marginBottom: 18 },
  filterSection: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.8, marginBottom: 10 },
  filterSearchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.background, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 10,
  },
  filterSearchPlaceholder: { fontSize: 13, color: COLORS.textLight },
  filterCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterCheckLabel: { fontSize: 14, color: COLORS.textDark, fontWeight: '500' },
  applyBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  applyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },

});