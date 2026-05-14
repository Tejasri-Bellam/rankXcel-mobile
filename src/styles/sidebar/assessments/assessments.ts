// src/styles/sidebar/assessmentsStyles.ts

import { StyleSheet } from 'react-native';

const PRIMARY = '#1A1A2E';
const BORDER = '#EFEFEF';
const GRAY = '#9898B0';
const ACCENT = '#6C5CE7';

export const assessmentsStyles = StyleSheet.create({

  // Layout
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Page Title
  pageTitleRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY,
  },
  pageSummary: {
    fontSize: 13,
    color: GRAY,
    marginTop: 2,
  },

  // Tab bar
  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F8',
  },
  tabBtnActive: {
    backgroundColor: PRIMARY,
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabBadgeTextActive: {
    color: '#fff',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardAccentBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },

  // Badge pill inside card
  badgeChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Card text
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: GRAY,
    marginBottom: 10,
  },

  // Meta row (clock, questions, marks)
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Card footer (date + action button)
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  dateLabel: {
    fontSize: 11,
    color: GRAY,
    flex: 1,
  },
  windowText: {
    fontSize: 11,
    color: GRAY,
    marginTop: 4,
  },

  // Action pill button
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  completedBtn: {
    backgroundColor: '#F0EDFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  completedBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: GRAY,
    textAlign: 'center',
    lineHeight: 20,
  },
});