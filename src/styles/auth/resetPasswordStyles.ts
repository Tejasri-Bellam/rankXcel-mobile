import { StyleSheet } from 'react-native';

export const resetPasswordStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF1FB',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },

  // Header row: back button on the left.
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Brand ──
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2F8AF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },

  // ── Headings ──
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },

  // ── Form ──
  form: {
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  required: {
    color: '#DC2626',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  inputWrapperError: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  inputWrapperSuccess: {
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  eyeBtn: {
    paddingLeft: 8,
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500',
    marginTop: 4,
  },

  // ── Strength bar ──
  strengthWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  strengthBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#DCE6F4',
    borderRadius: 4,
    overflow: 'hidden',
  },
  strengthFill: {
    height: 4,
    borderRadius: 4,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 52,
  },

  // ── Primary button ──
  primaryBtn: {
    backgroundColor: '#2F8AF4',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2F8AF4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Back link ──
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  backText: {
    fontSize: 13,
    color: '#2F8AF4',
    fontWeight: '600',
  },

  // ── Success state ──
  successIconWrapper: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 20,
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
});
