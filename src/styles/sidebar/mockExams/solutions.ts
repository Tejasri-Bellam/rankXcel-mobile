// src/components/mock/styles/mockSolutionStyles.ts
import { StyleSheet } from 'react-native';

const PRIMARY = '#1A1A2E';
const ACCENT  = '#6C5CE7';
const GRAY    = '#9898B0';
const BORDER  = '#E8E8F0';
const BG      = '#F7F7FB';
const GREEN   = '#22C55E';
const RED     = '#EF4444';

export const mockSolutionStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER, gap: 10,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backArrow: { fontSize: 20, color: ACCENT, fontWeight: '700' },
  backText: { fontSize: 13, color: ACCENT, fontWeight: '600' },
  headerCenter: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: PRIMARY },
  headerSub: { fontSize: 11, color: GRAY, marginTop: 1 },
  headerCounter: { fontSize: 13, fontWeight: '700', color: GRAY },

  // Body
  body: { flex: 1 },
  bodyRow: { flex: 1, flexDirection: 'row' },

  // Main column
  mainCol: { flex: 1, backgroundColor: '#fff' },

  // Wide-screen right-side navigator panel
  rightPanel: {
    width: 220, borderLeftWidth: 1, borderLeftColor: BORDER,
    backgroundColor: '#fff', padding: 14,
  },
  rightPanelTitle: { fontSize: 13, fontWeight: '800', color: PRIMARY, letterSpacing: 0.4, marginBottom: 10 },
  rightPanelLegendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  rightPanelSection: { fontSize: 11, fontWeight: '800', color: GRAY, letterSpacing: 0.6, marginBottom: 10 },
  rightPanelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  qMetaBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER, gap: 8,
  },
  qMetaLeft: { fontSize: 13, fontWeight: '700', color: PRIMARY },
  qTypeBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  qTypeText: { fontSize: 11, fontWeight: '700', color: ACCENT },
  marksInline: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  marksEarned: { fontSize: 13, fontWeight: '800' },
  marksEarnedCorrect: { color: GREEN },
  marksEarnedWrong:   { color: RED },
  marksEarnedSkipped: { color: GRAY },
  marksTotal: { fontSize: 13, fontWeight: '700', color: GRAY },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },

  sectionChip: {
    alignSelf: 'flex-start', backgroundColor: '#EEF2FF',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10,
  },
  sectionChipText: { fontSize: 11, fontWeight: '700', color: ACCENT },

  questionText: { fontSize: 14, color: PRIMARY, lineHeight: 22, fontWeight: '500', marginBottom: 16 },

  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#fff', marginBottom: 10,
  },
  optionCorrect: { borderColor: GREEN, backgroundColor: '#F0FDF4' },
  optionWrong:   { borderColor: RED,   backgroundColor: '#FEF2F2' },
  optionBubble: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
  },
  bubbleCorrect: { borderColor: GREEN, backgroundColor: GREEN },
  bubbleWrong:   { borderColor: RED,   backgroundColor: RED },
  optionBubbleText: { fontSize: 12, fontWeight: '700', color: GRAY },
  optionText: { flex: 1, fontSize: 13, color: PRIMARY, lineHeight: 20 },

  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 16 },
  statusCorrect: { backgroundColor: '#F0FDF4' },
  statusWrong:   { backgroundColor: '#FEF2F2' },
  statusSkipped: { backgroundColor: BG },
  statusBadgeText: { fontSize: 13, fontWeight: '700', color: PRIMARY },

  // Explanation
  explanationCard: {
    backgroundColor: '#EEF2FF', borderRadius: 10, padding: 16,
  },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  explanationBadge: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: GREEN,
    justifyContent: 'center', alignItems: 'center',
  },
  explanationBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  explanationLabel: { fontSize: 12, fontWeight: '800', color: ACCENT, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepsChip: { backgroundColor: ACCENT, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 'auto' },
  stepsChipText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  explanationStep: { marginBottom: 10 },
  stepLabel: { fontSize: 13, fontWeight: '700', color: PRIMARY, marginBottom: 4 },
  stepBody: { fontSize: 13, color: '#3A3A5A', lineHeight: 20 },
  explanationSummary: { marginTop: 8, fontSize: 13, fontWeight: '700', color: PRIMARY },

  // Compact navigator strip (mobile-friendly, above content)
  navigator: {
    borderBottomWidth: 1, borderBottomColor: BORDER,
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  navigatorTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navigatorTitle: { fontSize: 11, fontWeight: '800', color: PRIMARY, letterSpacing: 0.4 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: GRAY, fontWeight: '600' },

  numbersScroll: { marginTop: 2 },
  numbersRow: { flexDirection: 'row', gap: 8, paddingRight: 14 },
  numberBox: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
  },
  numberBoxActive: { borderWidth: 2 },
  numberText: { fontSize: 12, fontWeight: '800', color: PRIMARY },
  numberTextOnColor: { color: '#fff' },

  // Bottom nav row
  navRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: BORDER, gap: 10, backgroundColor: '#fff',
  },
  navBtn: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  navCounter: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: GRAY },
});
