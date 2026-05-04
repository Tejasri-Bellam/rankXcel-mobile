// src/components/auth/ForgotPasswordScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { forgotPasswordStyles as styles } from '../../styles/auth/forgotPasswordStyles';
import { forgotPasswordService } from '@/src/libs/services/auth';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'email' | 'otp' | 'newPassword' | 'success';

export type ForgotPasswordPayload = {
  email: string;
  otp?: string;
  new_password?: string;
  type?: 'send_otp' | 'verify_otp' | 'resend_otp' | 'reset_password';
};


// ─────────────────────────────────────────────────────────────────────────────
export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');

  // Step 1 – email
  const [email, setEmail] = useState('');

  // Step 2 – OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Step 3 – new password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Loading
  const [loading, setLoading] = useState(false);

  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    slideAnim.setValue(40);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  useEffect(() => {
    animateIn();
  }, [step]);

  // ── Resend OTP countdown ───────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'otp') return;
    setResendTimer(30);
    setCanResend(false);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSendOTP = async () => {
  if (!email.trim()) {
    Alert.alert('Error', 'Please enter your email address.');
    return;
  }

  setLoading(true);

  try {
    const response = await forgotPasswordService({
      email: email.trim().toLowerCase(),
    });

    console.log("Send OTP Response:", response);

    setStep('otp');
  } catch (error: any) {
    Alert.alert(
      'Error',
      error?.response?.data?.message || 'Failed to send OTP'
    );
  } finally {
    setLoading(false);
  }
};

  const handleOTPChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const entered = otp.join('');
    if (entered.length < 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP.');
      return;
    }
    setLoading(true);
    await new Promise((res) => setTimeout(res, 1000));
    setLoading(false);
    const handleVerifyOTP = async () => {
  const entered = otp.join('');

  if (entered.length < 6) {
    Alert.alert('Error', 'Please enter the complete 6-digit OTP.');
    return;
  }

  setLoading(true);

  try {
    const response = await forgotPasswordService({
      email: email.trim().toLowerCase(),
      otp: entered,
      type: "verify_otp" // optional (depends on backend)
    });

    console.log("Verify OTP Response:", response);

    setStep('newPassword');
  } catch (error: any) {
    Alert.alert(
      'Invalid OTP',
      error?.response?.data?.message || 'Incorrect OTP'
    );

    setOtp(['', '', '', '', '', '']);
    otpRefs.current[0]?.focus();
  } finally {
    setLoading(false);
  }
}; {
      Alert.alert('Invalid OTP', 'The OTP you entered is incorrect. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      return;
    }
    setStep('newPassword');
  };

  const handleResendOTP = async () => {
  if (!canResend) return;

  setLoading(true);

  try {
    await forgotPasswordService({
      email: email.trim().toLowerCase(),
      type: "resend_otp"
    });

    setOtp(['', '', '', '', '', '']);
    otpRefs.current[0]?.focus();
    setResendTimer(30);
    setCanResend(false);

    Alert.alert('Success', 'OTP resent successfully');
  } catch (error: any) {
    Alert.alert(
      'Error',
      error?.response?.data?.message || 'Failed to resend OTP'
    );
  } finally {
    setLoading(false);
  }
};

  const handleResetPassword = async () => {
  if (!newPassword || !confirmPassword) {
    Alert.alert('Error', 'Please fill in both password fields.');
    return;
  }

  if (newPassword !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match.');
    return;
  }

  setLoading(true);

  try {
    const response = await forgotPasswordService({
      email: email.trim().toLowerCase(),
      otp: otp.join(''),
      new_password: newPassword,
      type: "reset_password"
    });

    console.log("Reset Password Response:", response);

    setStep('success');
  } catch (error: any) {
    Alert.alert(
      'Error',
      error?.response?.data?.message || 'Failed to reset password'
    );
  } finally {
    setLoading(false);
  }
};

  const handleBackToLogin = () => {
    router.back();
  };

  // ── Password strength indicator ───────────────────────────────────────────
  const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: '', color: '#E5E7EB', width: '0%' };
    if (pwd.length < 6) return { label: 'Too short', color: '#EF4444', width: '25%' };
    if (pwd.length < 8) return { label: 'Weak', color: '#F97316', width: '45%' };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score === 3) return { label: 'Strong', color: '#22C55E', width: '100%' };
    if (score === 2) return { label: 'Good', color: '#3B82F6', width: '75%' };
    return { label: 'Fair', color: '#EAB308', width: '55%' };
  };

  const strength = getPasswordStrength(newPassword);

  // ── Step header config ────────────────────────────────────────────────────
  const STEP_CONFIG = {
    email: {
      icon: '🔒',
      title: 'Forgot Password?',
      subtitle: "No worries! Enter your registered email and we'll send you a reset OTP.",
    },
    otp: {
      icon: '📩',
      title: 'Check Your Email',
      subtitle: `We've sent a 6-digit OTP to\n${email}`,
    },
    newPassword: {
      icon: '🔑',
      title: 'Create New Password',
      subtitle: 'Your new password must be different from your previous password.',
    },
    success: {
      icon: '✅',
      title: 'Password Reset!',
      subtitle: 'Your password has been successfully updated. You can now log in with your new password.',
    },
  };

  const cfg = STEP_CONFIG[step];

  // ── Step indicator ────────────────────────────────────────────────────────
  const stepOrder: Step[] = ['email', 'otp', 'newPassword', 'success'];
  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        {step !== 'success' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={step === 'email' ? handleBackToLogin : () => {
              if (step === 'otp') setStep('email');
              else if (step === 'newPassword') setStep('otp');
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}

        <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }] }]}>

          {/* Step progress dots */}
          {step !== 'success' && (
            <View style={styles.stepDots}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.stepDot,
                    i <= currentStepIndex - 0 && i < 3 && styles.stepDotActive,
                    i < currentStepIndex && styles.stepDotDone,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Icon */}
          <Text style={styles.stepIcon}>{cfg.icon}</Text>

          {/* Title & subtitle */}
          <Text style={styles.title}>{cfg.title}</Text>
          <Text style={styles.subtitle}>{cfg.subtitle}</Text>

          {/* ── STEP 1: Email ────────────────────────────────────────────── */}
          {step === 'email' && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your registered email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkRow} onPress={handleBackToLogin}>
                <Text style={styles.linkText}>Remember your password? </Text>
                <Text style={styles.linkAccent}>Log In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: OTP ──────────────────────────────────────────────── */}
          {step === 'otp' && (
            <View style={styles.form}>
              {/* OTP boxes */}
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { otpRefs.current[index] = ref; }}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                    ]}
                    value={digit}
                    onChangeText={(val) => handleOTPChange(val, index)}
                    onKeyPress={({ nativeEvent }) => handleOTPKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              {/* Resend */}
              <View style={styles.resendRow}>
                <Text style={styles.linkText}>Didn't receive the OTP? </Text>
                <TouchableOpacity onPress={handleResendOTP} disabled={!canResend}>
                  <Text style={[styles.linkAccent, !canResend && styles.linkAccentDisabled]}>
                    {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dev hint */}
              <View style={styles.devHint}>
                <Text style={styles.devHintText}>💡 Demo OTP: {MOCK_OTP}</Text>
              </View>
            </View>
          )}

          {/* ── STEP 3: New Password ─────────────────────────────────────── */}
          {step === 'newPassword' && (
            <View style={styles.form}>
              {/* New password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowNew(!showNew)}
                  >
                    <Text style={styles.eyeIcon}>{showNew ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Strength bar */}
                {newPassword.length > 0 && (
                  <View style={styles.strengthWrapper}>
                    <View style={styles.strengthBarBg}>
                      <View
                        style={[
                          styles.strengthBarFill,
                          { width: strength.width as any, backgroundColor: strength.color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      confirmPassword.length > 0 && newPassword !== confirmPassword
                        ? styles.inputError
                        : null,
                    ]}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirm(!showConfirm)}
                  >
                    <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <Text style={styles.errorText}>Passwords do not match</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 4: Success ──────────────────────────────────────────── */}
          {step === 'success' && (
            <View style={styles.form}>
              <View style={styles.successCard}>
                <Text style={styles.successCardText}>
                  Your password has been reset successfully. Please log in with your new credentials.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleBackToLogin}
              >
                <Text style={styles.primaryBtnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}