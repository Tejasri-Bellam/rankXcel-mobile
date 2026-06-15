import { StyleSheet } from 'react-native';

const BRAND_BLUE = '#3B7DF8';
const TEXT_DARK = '#161A2B';
const TEXT_GRAY = '#9098B1';

export const forgotPasswordStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEEFF5',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },

  // ── Back button ──────────────────────────────────────────────────────────
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  backButtonIcon: {
    fontSize: 22,
    color: BRAND_BLUE,
    fontWeight: '700',
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BRAND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  logoLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
    letterSpacing: 0.2,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  headerSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_GRAY,
    lineHeight: 20,
  },

  // ── Form ──────────────────────────────────────────────────────────────────
  form: {
    gap: 0,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  inputWrapperFocused: {
    borderColor: BRAND_BLUE,
  },
  inputIcon: {
    fontSize: 15,
    color: '#9CA3AF',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
  },

  // ── Primary button ───────────────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: BRAND_BLUE,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Check email step ─────────────────────────────────────────────────────
  successIconWrapper: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheckmark: {
    color: '#22C55E',
    fontSize: 28,
    fontWeight: '700',
  },
  checkTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  checkSubtitle: {
    fontSize: 14,
    color: TEXT_GRAY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  emailHighlight: {
    color: TEXT_DARK,
    fontWeight: '600',
  },

  // ── Secondary button (Back to log in) ───────────────────────────────────
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  secondaryBtnText: {
    color: TEXT_DARK,
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Resend ────────────────────────────────────────────────────────────────
  resendRow: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 4,
  },
  resendText: {
    fontSize: 13,
    color: TEXT_GRAY,
    fontWeight: '500',
  },
});