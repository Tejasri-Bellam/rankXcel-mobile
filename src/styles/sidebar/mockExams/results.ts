// src/components/mock/styles/mockResultStyles.ts
import { StyleSheet } from 'react-native';

export const PRIMARY = '#1A1A2E';
export const ACCENT  = '#6C5CE7';
export const GREEN   = '#22C55E';
export const RED     = '#EF4444';
export const ORANGE  = '#F97316';
export const GRAY    = '#9898B0';
export const BORDER  = '#E8E8F0';
export const BG      = '#F7F7FB';

export const mockResultStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: 20, color: PRIMARY },
  backText: { fontSize: 14, color: GRAY, fontWeight: '500' },
  scrollContent: { padding: 16, paddingBottom: 60 },

  // Score card
  scoreCard: { backgroundColor: ORANGE, borderRadius: 18, padding: 20, marginBottom: 16 },
  scoreCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  scoreDate: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  scoreTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'capitalize' },
  scoreValue: { fontSize: 42, fontWeight: '900', color: '#fff', lineHeight: 48 },
  scoreDivider: { fontSize: 20, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  scorePercent: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  trophyContainer: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  trophyIcon: { fontSize: 32 },
  scoreStatsRow: { flexDirection: 'row', gap: 16 },
  scoreStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreStatDot: { width: 8, height: 8, borderRadius: 4 },
  scoreStatText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: '44%', backgroundColor: BG,
    borderRadius: 12, padding: 14, alignItems: 'flex-start', gap: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: PRIMARY },
  statLabel: { fontSize: 11, color: GRAY, fontWeight: '600' },
  statSub: { fontSize: 11, color: GRAY },

  // Section heading
  sectionHeading: {
    fontSize: 16, fontWeight: '700', color: PRIMARY, marginBottom: 12,
  },

  // Shared table shell
  table: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: BORDER, marginBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row', backgroundColor: BG,
    paddingHorizontal: 10, paddingVertical: 9,
  },
  tableRow: {
    flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: BORDER, alignItems: 'center',
  },

  // Subject-wise table cells
  subjectColSubject: {
    flex: 2, fontSize: 11, color: GRAY,
    fontWeight: '700', textTransform: 'uppercase',
  },
  subjectColData: {
    flex: 1, fontSize: 11, color: GRAY, fontWeight: '700',
    textTransform: 'uppercase', textAlign: 'center',
  },
  subjectNameCell: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 },
  subjectColorDot: { width: 10, height: 10, borderRadius: 5 },
  subjectNameText: { fontSize: 12, fontWeight: '600', color: PRIMARY, flexShrink: 1 },
  subjectDataCell: {
    flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'center',
  },

  // Chapter-wise table cells
  chapterColChapter: {
    flex: 2, fontSize: 11, color: GRAY,
    fontWeight: '700', textTransform: 'uppercase',
  },
  chapterColData: {
    flex: 1, fontSize: 11, color: GRAY, fontWeight: '700',
    textTransform: 'uppercase', textAlign: 'center',
  },
  chapterNameText: {
    flex: 2, fontSize: 12, fontWeight: '600', color: PRIMARY,
  },
  chapterDataCell: {
    flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'center',
  },

  // Next card
  nextCard: {
    marginTop: 28, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  nextCardTitle: {
    fontSize: 15, fontWeight: '700', color: PRIMARY,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  nextRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  nextIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  nextLabel: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  nextSub: { fontSize: 12, color: GRAY, marginTop: 2 },
  nextChevron: { fontSize: 18, color: GRAY },
});
 