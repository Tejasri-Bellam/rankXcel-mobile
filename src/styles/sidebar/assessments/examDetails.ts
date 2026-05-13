import { StyleSheet } from 'react-native';

const PRIMARY = '#1A1A2E';
const ACCENT = '#6C5CE7';
const GREEN = '#22C55E';
const RED = '#EF4444';
const ORANGE = '#F97316';
const GRAY = '#9898B0';
const BORDER = '#E8E8F0';
const BG = '#F7F7FB';

export const examDetailsStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F8',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: 20, color: '#1A1A2E', fontWeight: '600' },
  backText: { fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  title: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 10 },
  tagChip: {
    alignSelf: 'flex-start', backgroundColor: '#EEF2FF',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 20,
  },
  tagText: { fontSize: 13, color: '#6C5CE7', fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, minWidth: '44%', backgroundColor: '#F8F8FF',
    borderRadius: 14, padding: 14, alignItems: 'center', gap: 4,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#9898B0', fontWeight: '500' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  scheduleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  scheduleIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F8F8FF', alignItems: 'center', justifyContent: 'center',
  },
  scheduleIconText: { fontSize: 16 },
  scheduleInfo: { flex: 1 },
  scheduleMain: { fontSize: 14, color: '#1A1A2E', fontWeight: '500', lineHeight: 20 },
  scheduleLabel: { fontSize: 12, color: '#9898B0', marginTop: 2 },

  liveStartedBanner: {
    backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#86EFAC',
    borderRadius: 14, padding: 16, alignItems: 'center', marginVertical: 16,
  },
  liveStartedTitle: { fontSize: 16, fontWeight: '700', color: '#16A34A', marginBottom: 4 },
  liveStartedSub: { fontSize: 13, color: '#22C55E' },

  completedBanner: {
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14, marginBottom: 16,
  },

  instructionsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 12, padding: 14, marginTop: 12,
  },
  instructionsTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  instructionsSub: { fontSize: 11, color: '#B45309', marginTop: 1 },
  instructionsChevron: { fontSize: 18, color: '#92400E', fontWeight: '700' },

  instructionPreview: {
    backgroundColor: '#FFFBEB', borderLeftWidth: 3, borderLeftColor: '#FDE68A',
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 14, marginBottom: 8,
  },
  instructionLine: { fontSize: 13, color: '#78350F', lineHeight: 20 },

  actionGroup: { marginTop: 20, gap: 12 },
  actionBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8E8F0' },
  actionBtnTextWhite: { color: '#fff', fontSize: 15, fontWeight: '700' },

  bottomBar: {
    padding: 16, paddingBottom: 8, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F0F0F8',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 8,
  },
  resumeBtn: {
    backgroundColor: '#6C5CE7', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  resumeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});