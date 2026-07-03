import { StyleSheet } from 'react-native';

export const detailsStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FC' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, fontWeight: '600', color: '#6C63FF' },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginRight: 60,
  },

  mockIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 28,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  subjectsSection: { marginBottom: 28 },
  subjectsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  subjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    backgroundColor: '#EEF4FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DCE7FF',
  },
  subjectChipText: { fontSize: 10, fontWeight: '600', color: '#6C63FF' },

  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#F7F8FC',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 12,
  },
  startBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  completedRow: { flexDirection: 'row', gap: 10 },
  completedBtn: { flex: 1 },
  retakeBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#6C63FF',
  },
  retakeBtnText: { color: '#6C63FF' },
});
