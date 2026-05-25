// src/components/mock/styles/mockDetailsStyles.ts
import { StyleSheet } from 'react-native';

const PRIMARY = '#1A1A2E';
const ACCENT  = '#6C5CE7';
const GRAY    = '#9898B0';
const BORDER  = '#F0F0F5';
const BG      = '#F7F7FB';
const GREEN   = '#22C55E';
const ORANGE  = '#F97316';

export const mockDetailsStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: '#fff',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: 18, color: PRIMARY },
  backText: { fontSize: 14, color: GRAY, fontWeight: '500' },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 140 },

  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: 6,
  },
  subjectLabel: {
    fontSize: 14,
    color: GRAY,
    fontWeight: '500',
    marginBottom: 10,
  },
  tagChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 20,
  },
  tagText: { fontSize: 12, fontWeight: '700', color: ACCENT },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: BG,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: { fontSize: 22, marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: '700', color: PRIMARY, textAlign: 'center' },
  statLabel: { fontSize: 11, color: GRAY, textAlign: 'center' },

  completedBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completedBannerIcon: { fontSize: 20 },
  completedBannerTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
  completedBannerSub: { fontSize: 12, color: GREEN, marginTop: 2 },
  viewResultsBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewResultsBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  inProgressBanner: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 4,
    borderLeftColor: ACCENT,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  inProgressTitle: { fontSize: 14, fontWeight: '700', color: '#3730A3' },
  inProgressSub: { fontSize: 12, color: ACCENT, marginTop: 4 },

  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 1,
  },
  instructionsHeaderIcon: { fontSize: 18 },
  instructionsTitle: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  instructionsSub: { fontSize: 11, color: ORANGE },
  instructionsChevron: { fontSize: 18, color: GRAY },

  instructionsContainer: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  instructionRow: { flexDirection: 'row', marginBottom: 14 },
  instructionNumber: { fontSize: 15, fontWeight: '700', color: PRIMARY, marginRight: 8 },
  instructionText: { flex: 1, fontSize: 14, color: '#555', lineHeight: 22 },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    marginRight: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxChecked: { backgroundColor: '#2563EB', borderWidth: 1, borderColor: '#2563EB' },
  checkboxUnchecked: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1' },
  checkboxTick: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkboxLabel: { flex: 1, fontSize: 14, lineHeight: 22, color: '#475569' },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  primaryBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  /* ─── Completed-view additions ───────────────────────────────── */
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pillExam: {
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillExamText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  pillDifficulty: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillDifficultyText: { fontSize: 12, fontWeight: '700' },

  coverageCard: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  coverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  coverageTitle: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  coverageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  coverageChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  coverageChipText: { fontSize: 12, color: PRIMARY, fontWeight: '500' },
  coverageEmpty: { fontSize: 12, color: GRAY, fontStyle: 'italic' },

  bottomBarRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtnFlex: {
    flex: 1,
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtnFlex: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtnText: { color: PRIMARY, fontWeight: '700', fontSize: 14 },
});