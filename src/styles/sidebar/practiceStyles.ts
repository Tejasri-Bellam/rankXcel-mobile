import { StyleSheet } from 'react-native';
import { COLORS } from '../styles';

export const practiceStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 32 },

  // Hero
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  heroSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 3, lineHeight: 18 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },

  // Exam list
  examList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  examRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  examIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examIconBoxActive: {
    backgroundColor: COLORS.white,
  },
  examName: { fontSize: 15, fontWeight: '600', color: COLORS.textMedium },
  examNameActive: { color: COLORS.primary, fontWeight: '700' },
  examSubtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  // Subject tabs
  subjectTabsScroll: { marginTop: 20 },
  subjectTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  subjectTab: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  subjectTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  subjectTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium },
  subjectTabTextActive: { color: COLORS.white },

  // Chapter list
  chapterList: {
    marginTop: 12,
    paddingHorizontal: 16,
    gap: 0,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chapterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  chapterExpandIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterName: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  chapterTopics: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  chapterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noDataRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: { fontSize: 14, color: COLORS.textLight },
  practiceIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginTop: 4,
  },
  emptyText: { fontSize: 14, color: COLORS.textLight, fontWeight: '500' },




  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  accuracy: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  diffBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  diffTextActive: {
    color: COLORS.white,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  timerSub: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  beginBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});