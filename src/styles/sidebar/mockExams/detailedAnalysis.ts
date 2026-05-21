import { StyleSheet } from 'react-native';

const PRIMARY = '#1A1A2E';
const ACCENT  = '#6C5CE7';
const GRAY    = '#9898B0';
const BORDER  = '#E8E8F0';
const BG      = '#F7F7FB';

export const mockAnalysisStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: 18, color: PRIMARY },
  backText: { fontSize: 14, color: GRAY, fontWeight: '500' },

  scrollContent: { padding: 16, paddingBottom: 60 },

  pageTitle: { fontSize: 24, fontWeight: '800', color: PRIMARY, marginBottom: 2 },
  pageSubtitle: { fontSize: 13, color: GRAY, marginBottom: 12 },

  // Legend row (overall correct / wrong / skipped)
  legendRow: {
    flexDirection: 'row', gap: 16, marginBottom: 20,
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 13, fontWeight: '600', color: GRAY },

  // Tab row
  tabRow: { flexDirection: 'row', marginBottom: 20, gap: 0 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: ACCENT },
  tabText: { fontSize: 12, fontWeight: '600', color: GRAY },
  tabTextActive: { color: ACCENT },

  sectionLabel: {
    fontSize: 15, fontWeight: '700', color: PRIMARY,
    marginBottom: 14, marginTop: 4,
  },

  // Subject card (circle + stats)
  subjectCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: BORDER, marginBottom: 14,
  },
  subjectCardTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  subjectCardInfo: { flex: 1 },
  subjectCardName: { fontSize: 15, fontWeight: '700', color: PRIMARY, marginBottom: 8 },
  subjectLegendRow: { flexDirection: 'row', gap: 10 },
  subjectLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subjectLegendDot: { width: 7, height: 7, borderRadius: 4 },
  subjectLegendText: { fontSize: 12, fontWeight: '600', color: GRAY },

  progressBarTrack: {
    height: 6, backgroundColor: '#F0F0F5', borderRadius: 3, marginBottom: 14,
  },
  progressBarFill: {
    height: 6, borderRadius: 3,
  },

  subjectMiniStats: { flexDirection: 'row', gap: 0 },
  subjectMiniStat: { flex: 1, alignItems: 'center' },
  subjectMiniVal: { fontSize: 15, fontWeight: '800', color: PRIMARY },
  subjectMiniLabel: { fontSize: 11, color: GRAY, marginTop: 2 },

  // Score breakdown card
  breakdownCard: {
    borderRadius: 12, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', marginBottom: 24,
  },
  breakdownRow: { padding: 14, flexDirection: 'row', alignItems: 'center' },
  breakdownRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  breakdownLeft: { flex: 1 },
  breakdownSubject: { fontSize: 14, fontWeight: '700', color: PRIMARY, marginBottom: 4 },
  breakdownTagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  breakdownTag: { fontSize: 11, fontWeight: '600' },
  breakdownScore: { fontSize: 16, fontWeight: '800' },
  breakdownMark: { fontSize: 11, color: GRAY, fontWeight: '400' },
  breakdownLegend: {
    flexDirection: 'row', gap: 16, padding: 12,
    borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: BG,
  },
  breakdownLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breakdownLegendDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLegendText: { fontSize: 11, color: GRAY, fontWeight: '600' },

  // Chapter table
  chapterTable: {
    borderRadius: 12, borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  chapterTableHeader: {
    flexDirection: 'row', backgroundColor: BG,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  chapterHeaderCell: {
    flex: 1, fontSize: 10, fontWeight: '700', color: GRAY,
    textTransform: 'uppercase', textAlign: 'center',
  },
  chapterTableRow: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: BORDER, alignItems: 'center',
  },
  chapterCell: { flex: 1, fontSize: 12, color: PRIMARY, fontWeight: '500', textAlign: 'center' },
  chapterNameCell: { textAlign: 'left', fontWeight: '600' },
  chapterSubjectTag: {
    flex: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, alignItems: 'center',
  },
  chapterSubjectText: { fontSize: 10, fontWeight: '700' },
  accuracyBadge: {
    flex: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, alignItems: 'center',
  },
  accuracyText: { fontSize: 11, fontWeight: '700' },

  // AI insights
  insightCard: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fff',
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: BORDER,
    marginBottom: 12,
  },
  insightStrength: { borderLeftColor: '#22C55E', borderLeftWidth: 3 },
  insightWeakness: { borderLeftColor: '#EF4444', borderLeftWidth: 3 },
  insightIconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: BG,
    justifyContent: 'center', alignItems: 'center',
  },
  insightTitle: { fontSize: 14, fontWeight: '700', color: PRIMARY, marginBottom: 4 },
  insightDesc: { fontSize: 13, color: GRAY, lineHeight: 20 },
});