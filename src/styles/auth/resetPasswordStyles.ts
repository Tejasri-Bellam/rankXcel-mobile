import { StyleSheet } from 'react-native';
const BRAND_PURPLE = '#5B4FCF';

export const resetPasswordStyles = StyleSheet.create({
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
  },

  // ── Form ──
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
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
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  inputWrapperSuccess: {
    borderColor: '#22C55E',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eyeIcon: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
  },

  // ── Strength bar ──
  strengthWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  strengthBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  strengthFill: {
    height: 4,
    borderRadius: 4,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 52,
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
});