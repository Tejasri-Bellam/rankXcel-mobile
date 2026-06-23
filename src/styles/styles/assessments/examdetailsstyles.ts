import { StyleSheet } from 'react-native';

const ACCENT = '#6C5CE7';
const PRIMARY = '#1A1A2E';
const BORDER = '#F0F0F5';
const BG = '#F7F7FB';
const GRAY = '#9898B0';
const GREEN = '#22C55E';
const GREEN_BG = '#F0FDF4';
const ORANGE = '#F97316';
const RED = '#EF4444';

export const examDetailsStyles = StyleSheet.create({

  // ── Layout ──────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // ── Header ──────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: '#fff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backArrow: {
    fontSize: 18,
    color: PRIMARY,
  },
  backText: {
    fontSize: 14,
    color: GRAY,
    fontWeight: '500',
  },

  // ── Scroll ──────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // ── Status Badge Pill ────────────────────────────
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
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Title & Tag ──────────────────────────────────
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: GRAY,
    marginBottom: 8,
  },
  tagChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
  },

  // ── Stats Grid ───────────────────────────────────
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
  statIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: GRAY,
    textAlign: 'center',
  },

  // ── Schedule Section ─────────────────────────────
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 14,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  scheduleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleIconText: {
    fontSize: 18,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleMain: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  scheduleLabel: {
    fontSize: 11,
    color: GRAY,
    marginTop: 2,
  },

  // ── Banners ──────────────────────────────────────
  completedBanner: {
    backgroundColor: GREEN_BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completedBannerIcon: {
    fontSize: 20,
  },
  completedBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  completedBannerSub: {
    fontSize: 12,
    color: GREEN,
    marginTop: 2,
  },

  liveBanner: {
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  liveBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  liveBannerSub: {
    fontSize: 12,
    marginTop: 4,
  },

  // ── Instructions Accordion ────────────────────────
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F7F7FB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 1,
  },
  instructionsHeaderIcon: {
    fontSize: 18,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
  },
  instructionsSub: {
    fontSize: 11,
    color: ORANGE,
  },
  instructionsChevron: {
    fontSize: 18,
    color: GRAY,
  },
  instructionPreview: {
    backgroundColor: '#FFFDF0',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#F0E8D0',
  },
  instructionPreviewText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  instructionReadAll: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '600',
    marginTop: 8,
  },

  // ── Missed retry ─────────────────────────────────
  missedRetryBtn: {
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  missedRetryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Bottom Bar ───────────────────────────────────
  bottomBar: {
    paddingHorizontal: 16,
     paddingVertical: 12,
    paddingBottom: 50,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  resumeBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  resumeBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  completedBottomBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  completedBottomBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

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

instructionRow: {
  flexDirection: 'row',
  marginBottom: 14,
},

instructionNumber: {
  fontSize: 15,
  fontWeight: '700',
  color: '#1A1A2E',
  marginRight: 8,
},

instructionText: {
  flex: 1,
  fontSize: 14,
  color: '#555',
  lineHeight: 22,
},

checkboxRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginTop: 18,
  paddingTop: 16,
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
},

checkbox: {
  width: 22,
  height: 22,
  borderRadius: 6,
  marginRight: 12,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 2,
},

checkboxChecked: {
  backgroundColor: '#2563EB',
  borderWidth: 1,
  borderColor: '#2563EB',
},

checkboxUnchecked: {
  backgroundColor: '#fff',
  borderWidth: 1.5,
  borderColor: '#CBD5E1',
},

checkboxTick: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '700',
},

checkboxLabel: {
  flex: 1,
  fontSize: 14,
  lineHeight: 22,
  color: '#475569',
},
});
