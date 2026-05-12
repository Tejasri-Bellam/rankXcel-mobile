// src/components/exam/examStyles.ts

import { StyleSheet } from 'react-native';

const PRIMARY = '#1A1A2E';
const ACCENT = '#6C5CE7';
const GREEN = '#22C55E';
const RED = '#EF4444';
const ORANGE = '#F97316';
const GRAY = '#9898B0';
const BORDER = '#E8E8F0';
const BG = '#F7F7FB';

// ─────────────────────────────────────────────
// EXAM DETAIL SCREEN
// ─────────────────────────────────────────────
export const examDetailStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {flexDirection: 'row',alignItems: 'center',paddingHorizontal: 16,paddingVertical: 12,borderBottomWidth: 1,borderBottomColor: BORDER,
  },
  backBtn: {flexDirection: 'row',alignItems: 'center',gap: 6,
  },
  backArrow: {fontSize: 20,color: PRIMARY,
  },
  backText: {fontSize: 14,color: GRAY,fontWeight: '500',
  },
  scroll: {flex: 1,
  },
  scrollContent: {padding: 20,paddingBottom: 100,
  },
  liveBadge: {flexDirection: 'row',alignItems: 'center',gap: 6,marginBottom: 8,
  },
  liveDot: {width: 8,height: 8,borderRadius: 4,backgroundColor: GREEN,
  },
  liveText: {fontSize: 13,fontWeight: '700',color: GREEN,
  },
  examTitle: {fontSize: 28,fontWeight: '800',color: PRIMARY,marginBottom: 10,
  },
  tagChip: {backgroundColor: '#EEF2FF',paddingHorizontal: 12,paddingVertical: 4,borderRadius: 6,alignSelf: 'flex-start',
    marginBottom: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: BG,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: GRAY,
    textAlign: 'center',
  },
  scheduleSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  scheduleIconCol: {
    width: 30,
    alignItems: 'center',
  },
  scheduleIcon: {
    fontSize: 18,
  },
  scheduleMain: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  scheduleLabel: {
    fontSize: 11,
    color: GRAY,
    marginTop: 2,
  },
  liveBanner: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  liveBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  liveBannerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GREEN,
  },
  liveBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  liveBannerSub: {
    fontSize: 12,
    color: '#166534',
    paddingLeft: 18,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BG,
    borderRadius: 10,
    padding: 14,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
    flex: 1,
  },
  instructionsSubtitle: {
    fontSize: 12,
    color: ORANGE,
  },
  chevron: {
    fontSize: 14,
    color: GRAY,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  resumeBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  resumeBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});

// ─────────────────────────────────────────────
// EXAM INSTRUCTIONS SCREEN
// ─────────────────────────────────────────────
export const examInstructionsStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  instructionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 8,
  },
  instructionsBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
    lineHeight: 24,
  },
  instructionsBarHint: {
    fontSize: 11,
    color: ORANGE,
    marginLeft: 'auto',
    textAlign: 'right',
  },
  chevronUp: {
    fontSize: 16,
    color: GRAY,
    marginLeft: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    gap: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  numberCircle: {
    minWidth: 28,
    alignItems: 'flex-start',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#3A3A5A',
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  startBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});

// ─────────────────────────────────────────────
// EXAM SCREEN (Main Quiz)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// EXAM RESULT SCREEN
// ─────────────────────────────────────────────
export const examResultStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backArrow: {
    fontSize: 20,
    color: PRIMARY,
  },
  backText: {
    fontSize: 14,
    color: GRAY,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Score card (orange gradient)
  scoreCard: {
    backgroundColor: ORANGE,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  scoreCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  scoreDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 48,
  },
  scoreDivider: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  scorePercent: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  trophyContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyIcon: {
    fontSize: 32,
  },
  scoreStatsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  scoreStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scoreStatText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: BG,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    gap: 2,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: PRIMARY,
  },
  statLabel: {
    fontSize: 11,
    color: GRAY,
    fontWeight: '600',
  },
  statSub: {
    fontSize: 11,
    color: GRAY,
  },

  // Subject performance
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 12,
  },
  subjectTable: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  subjectTableHeader: {
    flexDirection: 'row',
    backgroundColor: BG,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  subjectRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    alignItems: 'center',
  },
  subjectCell: {
    flex: 1,
    fontSize: 12,
    color: GRAY,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  subjectColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
});