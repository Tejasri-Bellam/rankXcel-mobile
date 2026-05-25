// import { Dimensions, StyleSheet } from 'react-native';
// import { COLORS } from '../styles';
// const { width, height } = Dimensions.get('window');

// export const mockLibraryStyles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: COLORS.white },
//   scrollView: { flex: 1, backgroundColor: COLORS.background },
//   scrollContent: { paddingBottom: 40 },

//   // Page header
//   pageHeader: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
//     backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
//   },
//   pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
//   pageSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 3 },
//   requestBtn: {
//     flexDirection: 'row', alignItems: 'center', gap: 6,
//     backgroundColor: COLORS.primary, borderRadius: 10,
//     paddingHorizontal: 14, paddingVertical: 10,
//   },
//   requestBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

//   // Search
//   searchBox: {
//     flexDirection: 'row', alignItems: 'center', gap: 10,
//     backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 14,
//     borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
//     borderWidth: 1, borderColor: COLORS.border,
//   },
//   searchInput: { flex: 1, fontSize: 14, color: COLORS.textDark, padding: 0 },

//   // Tabs
//   tabRow: {
//     flexDirection: 'row', paddingHorizontal: 16, marginTop: 14, gap: 8,
//   },
//   tab: {
//     flexDirection: 'row', alignItems: 'center', gap: 6,
//     paddingHorizontal: 16, paddingVertical: 9,
//     borderRadius: 20, backgroundColor: COLORS.white,
//     borderWidth: 1.5, borderColor: COLORS.border,
//   },
//   tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
//   tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium },
//   tabTextActive: { color: COLORS.white },
//   tabBadge: {
//     backgroundColor: COLORS.red, borderRadius: 8,
//     paddingHorizontal: 5, paddingVertical: 1,
//   },
//   tabBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

//   // Filter bar
//   filterBar: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     paddingHorizontal: 16, marginTop: 14,
//   },
//   filterBtn: {
//     flexDirection: 'row', alignItems: 'center', gap: 6,
//     backgroundColor: COLORS.white, borderRadius: 10,
//     paddingHorizontal: 14, paddingVertical: 9,
//     borderWidth: 1.5, borderColor: COLORS.border,
//   },
//   filterBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
//   filterBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium },
//   sortBtn: {
//     flexDirection: 'row', alignItems: 'center', gap: 6,
//     backgroundColor: COLORS.white, borderRadius: 10,
//     paddingHorizontal: 14, paddingVertical: 9,
//     borderWidth: 1.5, borderColor: COLORS.border,
//   },
//   sortBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium },

//   // Sort dropdown (inline)
//   sortOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
//   sortDropdown: {
//     position: 'absolute', right: 16, top: 130,
//     backgroundColor: COLORS.white, borderRadius: 12,
//     borderWidth: 1, borderColor: COLORS.border,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.12, shadowRadius: 10, elevation: 8,
//     zIndex: 51, minWidth: 180,
//   },
//   sortOption: { paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
//   sortOptionActive: { backgroundColor: COLORS.primaryLight },
//   sortOptionText: { fontSize: 14, color: COLORS.textMedium, fontWeight: '500' },
//   sortOptionTextActive: { color: COLORS.primary, fontWeight: '700' },

//   // Results count
//   resultsCount: {
//     fontSize: 13, fontWeight: '600', color: COLORS.textLight,
//     paddingHorizontal: 16, marginTop: 14, marginBottom: 4,
//   },

//   // Mock Card
//   mockCard: {
//     backgroundColor: COLORS.white, borderRadius: 16,
//     marginHorizontal: 16, marginTop: 12, padding: 16,
//     shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 1, shadowRadius: 10, elevation: 2,
//   },
//   mockCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
//   examTag: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
//   examTagText: { fontSize: 12, fontWeight: '700' },
//   statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
//   statusDot: { width: 7, height: 7, borderRadius: 4 },
//   statusText: { fontSize: 12, fontWeight: '600' },
//   mockTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 2 },
//   mockSubject: { fontSize: 13, color: COLORS.textMedium, marginBottom: 10 },
//   mockMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
//   mockMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
//   mockMetaText: { fontSize: 12, color: COLORS.textLight },
//   diffBadge: { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3, marginLeft: 'auto' },
//   diffText: { fontSize: 12, fontWeight: '700' },

//   // Stats row (completed)
//   statsRow: {
//     flexDirection: 'row', alignItems: 'center',
//     marginTop: 12, paddingTop: 12,
//     borderTopWidth: 1, borderTopColor: COLORS.border,
//   },
//   statItem: { flex: 1, alignItems: 'center' },
//   statValue: { fontSize: 15, fontWeight: '800', color: COLORS.textDark },
//   statLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
//   statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },

//   lastAttempt: { fontSize: 11, color: COLORS.textLight, marginTop: 10 },

//   // Buttons
//   resumeBtn: {
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
//     backgroundColor: COLORS.primary, borderRadius: 10,
//     paddingVertical: 11, marginTop: 12,
//   },
//   resumeBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
//   startBtn: {
//     backgroundColor: COLORS.primaryLight, borderRadius: 10,
//     paddingVertical: 11, alignItems: 'center', marginTop: 12,
//     borderWidth: 1.5, borderColor: COLORS.primary,
//   },
//   startBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

//   // Load more
//   loadMoreBtn: {
//     alignSelf: 'center', marginTop: 20,
//     paddingHorizontal: 28, paddingVertical: 13,
//     borderRadius: 25, borderWidth: 1.5, borderColor: COLORS.border,
//     backgroundColor: COLORS.white,
//   },
//   loadMoreText: { fontSize: 14, fontWeight: '600', color: COLORS.textMedium },

//   // Filter Modal
//   modalOverlay: {
//     flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
//     justifyContent: 'flex-end',
//   },
//   filterPanel: {
//     backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
//     padding: 24, maxHeight: height * 0.8,
//   },
//   filterPanelTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textDark, marginBottom: 18 },
//   filterSection: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.8, marginBottom: 10 },
//   filterSearchBox: {
//     flexDirection: 'row', alignItems: 'center', gap: 8,
//     backgroundColor: COLORS.background, borderRadius: 10,
//     paddingHorizontal: 12, paddingVertical: 9,
//     borderWidth: 1, borderColor: COLORS.border, marginBottom: 10,
//   },
//   filterSearchPlaceholder: { fontSize: 13, color: COLORS.textLight },
//   filterCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
//   checkbox: {
//     width: 20, height: 20, borderRadius: 5,
//     borderWidth: 1.5, borderColor: COLORS.border,
//     alignItems: 'center', justifyContent: 'center',
//     backgroundColor: COLORS.white,
//   },
//   checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
//   filterCheckLabel: { fontSize: 14, color: COLORS.textDark, fontWeight: '500' },
//   applyBtn: {
//     backgroundColor: COLORS.primary, borderRadius: 12,
//     paddingVertical: 14, alignItems: 'center', marginTop: 20,
//   },
//   applyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },

// });




import { StyleSheet } from 'react-native';
import { COLORS } from '@/src/styles/styles';
 
export const mockLibraryStyles = StyleSheet.create({
  /* ===== Layout ===== */
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
 
  /* ===== Page header ===== */
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textDark || '#111827',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
  },
  requestBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
 
  /* ===== Search ===== */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark || '#111827',
    padding: 0,
  },
 
  /* ===== Tabs ===== */
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMedium || '#6B7280',
    textAlign: 'center',
  },
  tabTextActive: {
    color: COLORS.textDark || '#111827',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
 
  /* ===== Filter bar ===== */
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  filterBtnText: {
    fontSize: 13,
    color: COLORS.textMedium,
    fontWeight: '500',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  sortBtnText: {
    fontSize: 13,
    color: COLORS.textMedium,
    fontWeight: '500',
  },
 
  /* ===== Sort dropdown ===== */
  sortOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  sortDropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginTop: -8,
    alignSelf: 'flex-end',
    minWidth: 180,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sortOptionActive: {
    backgroundColor: '#EEF2FF',
  },
  sortOptionText: {
    fontSize: 13,
    color: COLORS.textMedium,
  },
  sortOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
 
  /* ===== Results count ===== */
  resultsCount: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 12,
  },
 
  /* ===== Mock Card ===== */
  mockCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  mockCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  examTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  examTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
 
  /* Status pill (right side of card top) */
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
 
  /* Title + subject */
  mockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark || '#111827',
    marginBottom: 2,
  },
  mockSubject: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 12,
  },
 
  /* Meta chips: duration · questions · marks */
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metaChipText: {
    fontSize: 12,
    color: COLORS.textMedium,
    fontWeight: '500',
  },
 
  /* Difficulty badge */
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
 
  /* Stats row (completed tests) */
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#D1FAE5',
  },
 
  lastAttempt: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 10,
  },
 
  /* Action buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  startBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  startBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  viewBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
 
  /* ===== Filter Modal ===== */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  filterPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark || '#111827',
  },
  filterResetText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterSection: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMedium,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  filterSearchPlaceholder: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  filterCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterCheckLabel: {
    fontSize: 14,
    color: COLORS.textDark || '#111827',
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  applyBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
 
  /* ===== Load more (legacy, kept for compatibility) ===== */
  loadMoreBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  /* ===== Request Mock Test modal ===== */
  requestPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  requestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark || '#111827',
  },
  requestSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark || '#111827',
    marginBottom: 6,
    marginTop: 10,
  },
  fieldRequired: {
    color: COLORS.red,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  selectBoxDisabled: {
    backgroundColor: '#F9FAFB',
  },
  selectText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark || '#111827',
  },
  selectPlaceholder: {
    color: COLORS.textLight,
  },
  dropdownPanel: {
    marginTop: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    maxHeight: 180,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: {
    backgroundColor: '#EEF2FF',
  },
  dropdownItemText: {
    fontSize: 13,
    color: COLORS.textDark || '#111827',
  },
  dropdownEmpty: {
    fontSize: 12,
    color: COLORS.textLight,
    padding: 12,
    textAlign: 'center',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  difficultyOptionActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  difficultyOptionText: {
    fontSize: 13,
    color: COLORS.textMedium,
    fontWeight: '600',
  },
  difficultyOptionTextActive: {
    color: COLORS.white,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineField: {
    flex: 1,
  },
  textInput: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 13,
    color: COLORS.textDark || '#111827',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cancelBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
    minWidth: 160,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
});