// EXAM SCREEN (Main Quiz)

import { StyleSheet } from 'react-native';

const PRIMARY = '#1A1A2E';
const ACCENT = '#6C5CE7';
const GREEN = '#22C55E';
const RED = '#EF4444';
const ORANGE = '#F97316';
const GRAY = '#9898B0';
const BORDER = '#E8E8F0';
const BG = '#F7F7FB';

export const examScreenStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  topLeft: {
    flex: 1,
  },
  examLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  examName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  timerBox: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  timerValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  submitTopBtn: {
    backgroundColor: RED,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitTopBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Tab switch warning
  tabWarningBanner: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  tabWarningIcon: {
    fontSize: 16,
    color: '#92400E',
  },
  tabWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },

  // Section tabs
  sectionTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: BORDER,
    backgroundColor: '#fff',
  },
  sectionTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  sectionTabActive: {
    borderBottomColor: ACCENT,
  },
  sectionTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY,
  },
  sectionTabTextActive: {
    color: ACCENT,
  },
  sectionTabCount: {
    fontSize: 11,
    color: GRAY,
    marginTop: 2,
  },
  sectionTabCountActive: {
    color: ACCENT,
  },

  // Question area
  questionScroll: {
    flex: 1,
  },
  questionScrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  qMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  qNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
  },
  qTypeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ACCENT,
  },
  marksBadges: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
  },
  correctMarkBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  wrongMarkBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  marksBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  questionText: {
    fontSize: 14,
    color: PRIMARY,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 12,
    color: GRAY,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  optionRowSelected: {
    borderColor: ACCENT,
    backgroundColor: '#EEF2FF',
  },
  optionBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  optionBubbleSelected: {
    borderColor: ACCENT,
    backgroundColor: ACCENT,
  },
  optionBubbleText: {
    fontSize: 13,
    fontWeight: '700',
    color: GRAY,
  },
  optionBubbleTextSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    color: PRIMARY,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: ACCENT,
    fontWeight: '600',
  },

  // Assertion-Reason cards
  arCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },
  arLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: ACCENT,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arText: {
    fontSize: 13,
    color: PRIMARY,
    lineHeight: 20,
  },

  // Numerical answer input
  numericInput: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
    backgroundColor: '#fff',
  },
  numericInputFilled: {
    borderColor: ACCENT,
    backgroundColor: '#FCFBFF',
  },
  numericHint: {
    fontSize: 11,
    color: GRAY,
    marginTop: 6,
  },

  // Bottom actions
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 10,
    backgroundColor: '#fff',
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBtnText: {
    fontSize: 12,
    color: '#4A4A6A',
    fontWeight: '600',
  },
  notVisitedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    marginLeft: 'auto',
  },
  notVisitedLabel: {
    fontSize: 11,
    color: GRAY,
  },

  // Nav row
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 10,
    backgroundColor: '#fff',
  },
  navBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  saveNextBtn: {
    flex: 1,
    backgroundColor: ACCENT,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveNextBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Submit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalWarningIcon: {
    fontSize: 22,
    color: ORANGE,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PRIMARY,
  },
  modalSubtitle: {
    fontSize: 12,
    color: GRAY,
    marginTop: 2,
  },
  modalClose: {
    fontSize: 18,
    color: GRAY,
    padding: 4,
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modalStatBox: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  modalStatBoxGreen: { backgroundColor: '#F0FDF4' },
  modalStatBoxRed: { backgroundColor: '#FEF2F2' },
  modalStatBoxPurple: { backgroundColor: '#F5F3FF' },
  modalStatBoxGray: { backgroundColor: '#F9FAFB' },
  modalStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: PRIMARY,
  },
  modalStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTable: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTableHeader: {
    flexDirection: 'row',
    backgroundColor: BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionTableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: GRAY,
    textTransform: 'uppercase',
  },
  sectionTableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  sectionTableCell: {
    flex: 1,
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '500',
  },
  tabSwitchWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  tabSwitchWarningIcon: {
    fontSize: 14,
    color: '#92400E',
  },
  tabSwitchWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  goBackBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  goBackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
  },
  submitExamBtn: {
    flex: 1,
    backgroundColor: RED,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitExamBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});