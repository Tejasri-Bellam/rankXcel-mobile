// src/components/mock/styles/mockResultStyles.ts
import { StyleSheet } from 'react-native';

export const mockResultStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E8E8F0',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: 20, color: '#1A1A2E' },
  backText: { fontSize: 14, color: '#9898B0', fontWeight: '500' },
  scrollContent: { padding: 16, paddingBottom: 60 },

  // Score card
  scoreCard: { backgroundColor: '#F97316', borderRadius: 18, padding: 20, marginBottom: 16 },
  scoreCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  scoreDate: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
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
    flex: 1, minWidth: '44%', backgroundColor: '#F7F7FB',
    borderRadius: 12, padding: 14, alignItems: 'flex-start', gap: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 11, color: '#9898B0', fontWeight: '600' },
  statSub: { fontSize: 11, color: '#9898B0' },

  // Next card
  nextCard: {
    marginTop: 28, borderRadius: 16,
    borderWidth: 1, borderColor: '#E8E8F0', overflow: 'hidden',
  },
  nextCardTitle: {
    fontSize: 15, fontWeight: '700', color: '#1A1A2E',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  nextRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#E8E8F0',
  },
  nextIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  nextLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  nextSub: { fontSize: 12, color: '#9898B0', marginTop: 2 },
  nextChevron: { fontSize: 18, color: '#9898B0' },
});