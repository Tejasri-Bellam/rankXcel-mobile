import { StyleSheet } from 'react-native';

const PRIMARY = '#4F46E5';
const NAVY = '#12102B';
const LAVENDER_BG = '#F5F4FF';
const TEXT_DARK = '#0F0E2C';
const TEXT_GRAY = '#6B7280';
const BORDER = '#E9E7FF';
const GREEN = '#16A34A';

export const marketingStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  section: { paddingHorizontal: 20, paddingVertical: 28 },

  /* Header (shared across pages) */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F5',
    backgroundColor: '#FFFFFF',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { width: 30, height: 30, backgroundColor: PRIMARY, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logoIconText: { color: '#FFFFFF', fontSize: 15 },
  logoText: { fontSize: 18, fontWeight: '700', color: TEXT_DARK },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  loginText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  signupBtn: { backgroundColor: PRIMARY, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  signupText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  /* Breadcrumb */
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  breadcrumbText: { fontSize: 13, fontWeight: '600' },
  breadcrumbLink: { color: PRIMARY },
  breadcrumbCurrent: { color: TEXT_GRAY },

  /* Generic headings */
  h1: { fontSize: 24, fontWeight: '800', color: TEXT_DARK, marginBottom: 8 },
  h1Subtitle: { fontSize: 14, color: TEXT_GRAY, lineHeight: 21, marginBottom: 24 },

  /* How it works steps */
  stepsGrid: { gap: 14, marginBottom: 24 },
  stepCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#EFEEF5' },
  stepIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: TEXT_DARK, marginBottom: 6 },
  stepDesc: { fontSize: 13, color: TEXT_GRAY, lineHeight: 19 },

  primaryBtnFull: { backgroundColor: PRIMARY, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  primaryBtnFullText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  /* Search bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_DARK },

  /* Course list grid */
  courseListGrid: { gap: 14 },
  courseListCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#EFEEF5' },
  courseListTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  courseListIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  courseListIcon: { fontSize: 20 },
  courseFreeTag: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', height: 20 },
  courseFreeTagText: { fontSize: 10, fontWeight: '700', color: GREEN },
  courseListTitle: { fontSize: 16, fontWeight: '700', color: TEXT_DARK, marginBottom: 4 },
  courseListDesc: { fontSize: 12, color: TEXT_GRAY, lineHeight: 17, marginBottom: 12 },
  courseListMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#F1F0F7', paddingTop: 10 },
  courseListMetaText: { fontSize: 12, color: TEXT_GRAY },
  courseListPriceOld: { fontSize: 12, color: '#B0AEC0', textDecorationLine: 'line-through', marginLeft: 'auto' },
  courseListPriceFree: { fontSize: 13, fontWeight: '700', color: GREEN },

  /* Course detail hero band */
  courseHeroBand: { paddingHorizontal: 20, paddingVertical: 22 },
  courseHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  courseHeroIconBox: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  courseHeroIconText: { fontSize: 28 },
  courseHeroTitle: { fontSize: 22, fontWeight: '800', color: TEXT_DARK, marginBottom: 4 },
  courseHeroTagline: { fontSize: 13, color: TEXT_GRAY },
  courseHeroMetaRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  courseHeroMetaText: { fontSize: 12, color: TEXT_GRAY, fontWeight: '600' },

  /* Tabs */
  tabRow: { flexDirection: 'row', backgroundColor: '#F3F2FA', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabItem: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabItemActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
  tabText: { fontSize: 12, fontWeight: '600', color: TEXT_GRAY },
  tabTextActive: { color: TEXT_DARK },

  /* Syllabus */
  syllabusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEEF5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  syllabusIcon: { fontSize: 18, marginRight: 10 },
  syllabusName: { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT_DARK },
  syllabusTopics: { fontSize: 12, color: TEXT_GRAY },
  sampleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: LAVENDER_BG,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  sampleBannerText: { flex: 1, fontSize: 12, color: PRIMARY, fontWeight: '600' },

  /* Fallback preview (no full detail) */
  previewFallback: { alignItems: 'center', paddingVertical: 30 },
  previewFallbackIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: LAVENDER_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  previewFallbackTitle: { fontSize: 15, fontWeight: '700', color: TEXT_DARK, marginBottom: 6 },
  previewFallbackDesc: { fontSize: 13, color: TEXT_GRAY, textAlign: 'center', paddingHorizontal: 20 },

  /* What's included */
  includedRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  includedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: LAVENDER_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  includedTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginBottom: 2 },
  includedDesc: { fontSize: 12, color: TEXT_GRAY, lineHeight: 17 },

  /* FAQs */
  faqCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFEEF5', borderRadius: 12, padding: 16, marginBottom: 12 },
  faqQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginRight: 10 },
  faqAnswer: { fontSize: 13, color: TEXT_GRAY, lineHeight: 20, marginTop: 10 },

  /* Price card */
  priceCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFEEF5', borderRadius: 16, padding: 20, marginTop: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  priceMain: { fontSize: 26, fontWeight: '800', color: TEXT_DARK },
  priceMrp: { fontSize: 14, color: '#B0AEC0', textDecorationLine: 'line-through' },
  pricePeriod: { fontSize: 13, color: TEXT_GRAY },
  discountBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 8 },
  discountBadgeText: { fontSize: 11, fontWeight: '700', color: GREEN },
  launchOfferText: { fontSize: 12, color: TEXT_GRAY, marginBottom: 16 },
  subscribeBtn: { backgroundColor: PRIMARY, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  subscribeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  priceCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  priceCheckText: { fontSize: 13, color: '#374151' },

  freeDiagnosticNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: LAVENDER_BG,
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
  },
  freeDiagnosticNoteText: { flex: 1, fontSize: 12, color: PRIMARY, fontWeight: '600' },

  /* Footer (shared) */
  footer: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 36, paddingBottom: 24 },
  footerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  footerLogoIcon: { width: 28, height: 28, backgroundColor: PRIMARY, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  footerLogoIconText: { color: '#FFFFFF', fontSize: 13 },
  footerLogoText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  footerDescription: { fontSize: 12, color: '#9CA3AF', marginBottom: 26, lineHeight: 18 },
  footerColumnsRow: { flexDirection: 'row', marginBottom: 26, gap: 20 },
  footerColumn: { flex: 1 },
  footerHeading: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 10 },
  footerLink: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  copyright: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
});