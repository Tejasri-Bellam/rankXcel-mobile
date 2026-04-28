import { COLORS } from "../styles";

export const chartStyles: any = ({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    marginTop: 8,
  },
  col: { alignItems: 'center', flex: 1, gap: 4 },
  value: { fontSize: 9, color: COLORS.textMedium, fontWeight: '600' },
  bar: { width: 22, borderRadius: 5, opacity: 0.9 },
  label: { fontSize: 9, color: COLORS.textLight },
});


export const donutStyles:any = ({
  row: { gap: 14, marginTop: 8 },
  barStack: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  segment: { height: 14 },
  segFirst: { borderTopLeftRadius: 7, borderBottomLeftRadius: 7 },
  segLast: { borderTopRightRadius: 7, borderBottomRightRadius: 7 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, color: COLORS.textMedium, fontWeight: '600' },
  legendPct: { fontSize: 12, color: COLORS.textLight },
});

export const analyticsStyles: any = ({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 16 },

  // Page title
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    flexWrap: 'wrap',
    gap: 10,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, letterSpacing: -0.3 },
  pageSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  // Period selector
  periodRow: { flexDirection: 'row', gap: 4 },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText: { fontSize: 12, fontWeight: '600', color: COLORS.textMedium },
  periodTextActive: { color: COLORS.white },

  // Stats scroll row
  statRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statPill: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    width: 130,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBg: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  statLabel: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },
  statDelta: { fontSize: 10, fontWeight: '600', marginTop: 4 },

  // Card
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  cardSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  improvingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.greenLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  improvingText: { fontSize: 11, color: COLORS.green, fontWeight: '600' },
  aiLabel: { fontSize: 11, color: COLORS.textLight, fontStyle: 'italic' },

  // Subject accuracy
  subjectAccuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  subjectIcon: { fontSize: 14 },
  subjectName: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  subjectPct: { fontSize: 13, fontWeight: '700' },
  accuracyBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 4 },
  accuracyBarFill: { height: 6, borderRadius: 4 },

  // Rank progression
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rankDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  rankDate: { fontSize: 12, color: COLORS.textLight, width: 50 },
  rankValue: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  rankDelta: { fontSize: 12, fontWeight: '600' },

  // Weak chapters
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chapterRank: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  chapterRankText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  chapterNameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6,
  },
  chapterName: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, flex: 1 },
  subjectTag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  subjectTagText: { fontSize: 10, fontWeight: '600' },
  chapterBarBg: { height: 5, backgroundColor: COLORS.border, borderRadius: 4 },
  chapterBarFill: { height: 5, borderRadius: 4 },
  chapterPct: { fontSize: 13, fontWeight: '700', marginLeft: 10 },

  // Mock history table
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    marginBottom: 2,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: { backgroundColor: '#FAFBFF' },
  tableCell: { flex: 1, fontSize: 12, color: COLORS.textDark },
  tableSub: { fontSize: 10, color: COLORS.textLight, marginTop: 1 },
});