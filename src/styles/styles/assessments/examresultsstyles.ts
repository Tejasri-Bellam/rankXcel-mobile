import { StyleSheet } from 'react-native';

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 1,
};

export const examResultsStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FC' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FC', padding: 24 },
  centeredText: { marginTop: 12, color: '#9CA3AF', textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#3B7DF8', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  topBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, fontWeight: '600', color: '#3B7DF8' },

  scrollContent: { padding: 16, paddingBottom: 28 },

  // Hero banner
  banner: {
    backgroundColor: '#C0395C',
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  ringWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 125,
    height: 125,
    borderRadius: 62,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  bannerScoreWrap: { flexDirection: 'row', alignItems: 'flex-start' },
  bannerScore: { fontSize: 64, fontWeight: '900', color: '#fff', lineHeight: 70 },
  bannerScorePct: { fontSize: 24, fontWeight: '800', color: 'rgba(255,255,255,0.9)', marginTop: 8 },
  bannerSub: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.92)', marginBottom: 14 },

  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Stat cards
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
    ...CARD_SHADOW,
  },
  statValue: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  // Review card
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 14,
    ...CARD_SHADOW,
  },
  reviewCardText: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    ...CARD_SHADOW,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },

  // Practice next
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  practiceIcon: { width: 36, height: 36, borderRadius: 10 },
  practiceName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  practiceSub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  practicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF4FF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  practicePillText: { fontSize: 12, fontWeight: '700', color: '#3B7DF8' },

  // Strength by subject
  subjectRow: { marginBottom: 14 },
  subjectHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  subjectNameWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  subjectDot: { width: 12, height: 12, borderRadius: 3 },
  subjectName: { fontSize: 14, fontWeight: '600', color: '#1A1A2E', flexShrink: 1 },
  subjectPct: { fontSize: 14, fontWeight: '800' },
  subjectTrack: { height: 7, borderRadius: 4, backgroundColor: '#EEF0F4', overflow: 'hidden' },
  subjectFill: { height: '100%', borderRadius: 4 },

  // Percentile banner
  beatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    ...CARD_SHADOW,
  },
  trophyWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beatTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  beatSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  // Bottom actions
  actionsRow: { flexDirection: 'row', gap: 12 },
  doneBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  keepGoingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
  },
  keepGoingText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
