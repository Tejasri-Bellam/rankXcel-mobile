import { StyleSheet } from 'react-native';

const BRAND_PURPLE = '#5B4FCF';
const BRAND_PURPLE_LIGHT = '#EEF2FF';

export const forgotPasswordStyles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Back button ─────────────────────────────────────────────────────────
  backButton: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },

  // ── Animated content wrapper ─────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  // ── Step progress dots ────────────────────────────────────────────────────
  stepDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },

  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },

  stepDotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },

  stepDotDone: {
    backgroundColor: '#93C5FD',
    width: 8,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  stepIcon: {
    fontSize: 44,
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 32,
  },

  // ── Form ──────────────────────────────────────────────────────────────────
  form: {
    gap: 0,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },

  // ── Password field with eye toggle ────────────────────────────────────────
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1F2937',
  },

  inputError: {
    color: '#EF4444',
  },

  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  eyeIcon: {
    fontSize: 18,
  },

  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 2,
  },

  // ── Password strength bar ─────────────────────────────────────────────────
  strengthWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },

  strengthBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },

  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },

  // ── OTP boxes ─────────────────────────────────────────────────────────────
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 28,
  },

  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
  },

  otpBoxFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
  },

  // ── Link row (resend / back to login) ─────────────────────────────────────
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },

  linkText: {
    fontSize: 14,
    color: '#6B7280',
  },

  linkAccent: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },

  linkAccentDisabled: {
    color: '#9CA3AF',
  },

  // ── Dev hint (remove in production) ──────────────────────────────────────
  devHint: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },

  devHintText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },

  // ── Success card ──────────────────────────────────────────────────────────
  successCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 28,
  },

  successCardText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 22,
    textAlign: 'center',
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  // ── Logo ──
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    gap: 10,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 0.3,
  },

  // ── Success icon ──
  successIconWrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },
  successIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheckmark: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
  },

  // ── Header ──
  headerSection: {
    marginBottom: 28,
  },

  emailHighlight: {
    color: '#111827',
    fontWeight: '600',
  },

  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: BRAND_PURPLE,
    backgroundColor: '#FEFEFE',
    shadowColor: BRAND_PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIconContainer: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputIcon: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 14,
    paddingRight: 14,
  },

  // ── Primary button ──
  primaryBtn: {
    backgroundColor: BRAND_PURPLE,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ── Back link ──
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginTop: 4,
  },
  backArrow: {
    fontSize: 14,
    color: '#6B7280',
  },
  backText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // ── Didn't receive box ──
  didntReceiveBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  didntReceiveTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  tipList: {
    gap: 6,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBullet: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },

  // ── Resend ──
  resendRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  resendText: {
    fontSize: 14,
    color: BRAND_PURPLE,
    fontWeight: '500',
  },
});