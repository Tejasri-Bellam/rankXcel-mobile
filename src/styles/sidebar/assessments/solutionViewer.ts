import { StyleSheet } from 'react-native';

const PRIMARY = '#1A1A2E';
const ACCENT = '#6C5CE7';
const GREEN = '#22C55E';
const RED = '#EF4444';
const ORANGE = '#F97316';
const GRAY = '#9898B0';
const BORDER = '#E8E8F0';
const BG = '#F7F7FB';


export const solutionViewerStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 10,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: PRIMARY },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: PRIMARY },
  headerSub: { fontSize: 11, color: GRAY, marginTop: 1 },
  headerCounter: { fontSize: 13, fontWeight: '700', color: GRAY },

  // Pills
  pillsScroll: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexGrow: 0,
  },
  pillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pillText: { fontSize: 12, fontWeight: '700', color: PRIMARY },

  // Q Meta
  qMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 8,
  },
  qMetaLeft: { fontSize: 13, fontWeight: '700', color: PRIMARY },
  qTypeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qTypeText: { fontSize: 11, fontWeight: '700', color: ACCENT },
  marksBadges: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  markBadgeGreen: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  markBadgeRed: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  markBadgeGray: {
    backgroundColor: BG,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  markText: { fontSize: 11, fontWeight: '700', color: '#374151' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },

  questionText: {
    fontSize: 14,
    color: PRIMARY,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 16,
  },

  // Options
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
  optionCorrect: {
    borderColor: GREEN,
    backgroundColor: '#F0FDF4',
  },
  optionWrong: {
    borderColor: RED,
    backgroundColor: '#FEF2F2',
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
  bubbleCorrect: { borderColor: GREEN, backgroundColor: GREEN },
  bubbleWrong: { borderColor: RED, backgroundColor: RED },
  optionBubbleText: { fontSize: 13, fontWeight: '700', color: GRAY },
  optionText: { flex: 1, fontSize: 13, color: PRIMARY, lineHeight: 20 },

  // Status badge
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusCorrect: { backgroundColor: '#F0FDF4' },
  statusWrong: { backgroundColor: '#FEF2F2' },
  statusSkipped: { backgroundColor: BG },
  statusBadgeText: { fontSize: 13, fontWeight: '700', color: PRIMARY },

  // Explanation
  explanationCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepsChip: {
    backgroundColor: ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stepsChipText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  explanationStep: { marginBottom: 10 },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 4,
  },
  stepBody: { fontSize: 13, color: '#3A3A5A', lineHeight: 20 },
  explanationSummary: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
  },

  // Nav
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
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  navCounter: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: GRAY,
  },
});