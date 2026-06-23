import { StyleSheet } from 'react-native';

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#4F3FF0',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F0C2E',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginBtn: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  signupFreeBtn: {
    backgroundColor: '#4F3FF0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signupFreeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  /* ── Hero ── */
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 36,
    backgroundColor: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  badgeText: {
    color: '#4F3FF0',
    fontSize: 12,
    fontWeight: '600',
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F0C2E',
    marginBottom: 4,
    lineHeight: 36,
  },
  highlightTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#4F3FF0',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  startBtn: {
    backgroundColor: '#4F3FF0',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  outlineLoginBtn: {
    borderWidth: 1.5,
    borderColor: '#4F3FF0',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  outlineLoginText: {
    color: '#4F3FF0',
    fontSize: 15,
    fontWeight: '600',
  },
  featuresGrid: {
    marginTop: 4,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkmark: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
    flexShrink: 1,
  },

  /* ── Stats 2×2 grid ── */
  statsSection: {
    backgroundColor: '#15135C',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: '#A5B4FC',
    fontSize: 12,
    textAlign: 'center',
  },

  /* ── How It Works ── */
  howItWorksSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F0C2E',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 34,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  stepCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  stepPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepPillText: {
    color: '#4F3FF0',
    fontSize: 12,
    fontWeight: '800',
  },
  stepIcon: {
    fontSize: 20,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F0C2E',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },

  /* ── Features / Built for aspirants ── */
  featuresSection: {
    backgroundColor: '#F8F7FF',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9E6FF',
    shadowColor: '#4F3FF0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    backgroundColor: '#EEF2FF',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureCardIcon: {
    fontSize: 24,
  },
  featureCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F0C2E',
    marginBottom: 8,
  },
  featureCardDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 14,
  },
  checklist: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkmarkGreen: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  checklistText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },

  /* ── Testimonials ── */
  testimonialSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
  },
  testimonialCard: {
    backgroundColor: '#F8F7FF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  stars: {
    color: '#F5C842',
    fontSize: 16,
    marginBottom: 10,
    letterSpacing: 2,
  },
  testimonialText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  testimonialAuthorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F0C2E',
  },
  testimonialAuthorSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  /* ── CTA ── */
  ctaSection: {
    backgroundColor: '#15135C',
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  createAccountBtn: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 18,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  createAccountText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  alreadyAccountText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },

  /* ── Footer ── */
  footer: {
    backgroundColor: '#0A091F',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 24,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  footerLogoIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#4F3FF0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLogoIconText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  footerLogo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 28,
    lineHeight: 18,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  footerColumn: {
    flex: 1,
  },
  footerHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  footerLink: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 7,
  },
  copyright: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
});
