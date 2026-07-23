import { StyleSheet } from 'react-native';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF1FB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },

  // Header row: back button on the left, country selector on the right.
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  // Back button (white rounded square with chevron)
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

  // Brand row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Headings
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },

  // Segmented tab switch
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#DCE6F4',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
  },

  // Form
  form: {
    marginTop: 16,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
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
  requiredStar: {
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
  inputIcon: {
    marginRight: 8,
  },
  fieldError: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500',
    marginTop: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  inputHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Forgot password
  forgotPassword: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '600',
    marginTop: -2,
    marginBottom: 14,
  },

  // Primary button
  primaryButton: {
    backgroundColor: '#6C63FF',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  // Greyed-out look while the terms checkbox is unticked.
  primaryButtonDisabled: {
    backgroundColor: '#C7C4F4',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 13,
    color: '#94A3B8',
  },

  // Social buttons
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 11,
    marginBottom: 10,
  },
  appleButton: {
    backgroundColor: '#1E293B',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  socialIcon: {
    marginRight: 10,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  googleButtonText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '600',
  },
  googleG: {
    fontSize: 17,
    fontWeight: '800',
    color: '#6C63FF',
    marginRight: 10,
  },

  // Terms checkbox (signup)
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
  },

  // Footer terms text
  footerTerms: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  footerTermsLink: {
    color: '#64748B',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
