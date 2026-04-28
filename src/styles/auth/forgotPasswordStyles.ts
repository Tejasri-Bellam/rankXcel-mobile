// src/styles/auth/forgotPasswordStyles.ts

import { StyleSheet } from 'react-native';

export const forgotPasswordStyles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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

  // ── Primary CTA button ────────────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    height: 52,
  },

  primaryBtnDisabled: {
    backgroundColor: '#93C5FD',
  },

  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Link row (resend / back to login) ─────────────────────────────────────
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },

  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
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
});