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
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { forgotPasswordService } from '@/src/libs/services/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { forgotPasswordStyles } from '@/src/styles/auth/forgotPasswordStyles';

// Types
  
  type Step = 'email' | 'checkEmail';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    slideAnim.setValue(30);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, [step]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await forgotPasswordService({
        email: email.trim().toLowerCase(),
      });

      setStep('checkEmail');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to send reset link. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      await forgotPasswordService({
        email: email.trim().toLowerCase(),
      });
      Alert.alert('Sent', 'Reset link has been resent to your email.');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to resend. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  // ─── Logo Component ───────────────────────────────────────────────────────
  const Logo = () => (
    <View style={forgotPasswordStyles.logoContainer}>
      <View style={forgotPasswordStyles.logoBox}>
        <Text style={forgotPasswordStyles.logoText}>RX</Text>
      </View>
      <Text style={forgotPasswordStyles.logoLabel}>RankXcel</Text>
    </View>
  );

  // ─── Email Step ───────────────────────────────────────────────────────────
  if (step === 'email') {
    return (
      <SafeAreaView style={forgotPasswordStyles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={forgotPasswordStyles.flex}
        >
          <ScrollView
            contentContainerStyle={forgotPasswordStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                forgotPasswordStyles.card,
                {
                  transform: [{ translateY: slideAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              <Logo />

              <View style={forgotPasswordStyles.headerSection}>
                <Text style={forgotPasswordStyles.title}>Reset your password</Text>
                <Text style={forgotPasswordStyles.subtitle}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>
              </View>

              <View style={forgotPasswordStyles.form}>
                <View style={forgotPasswordStyles.inputGroup}>
                  <Text style={forgotPasswordStyles.label}>
                    Email address <Text style={forgotPasswordStyles.required}>*</Text>
                  </Text>
                  <View
                    style={[
                      forgotPasswordStyles.inputWrapper,
                      emailFocused && forgotPasswordStyles.inputWrapperFocused,
                    ]}
                  >
                    <View style={forgotPasswordStyles.inputIconContainer}>
                      {/* Mail icon using unicode */}
                      <Text style={forgotPasswordStyles.inputIcon}>✉</Text>
                    </View>
                    <TextInput
                      style={forgotPasswordStyles.textInput}
                      placeholder="you@example.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[forgotPasswordStyles.primaryBtn, loading && forgotPasswordStyles.primaryBtnDisabled]}
                  onPress={handleSendResetLink}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={forgotPasswordStyles.primaryBtnText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={forgotPasswordStyles.backRow}
                  onPress={handleBackToLogin}
                  activeOpacity={0.7}
                >
                  <Text style={forgotPasswordStyles.backArrow}>←</Text>
                  <Text style={forgotPasswordStyles.backText}> Back to login</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Check Email Step ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={forgotPasswordStyles.safeArea}>
      <ScrollView
        contentContainerStyle={forgotPasswordStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            forgotPasswordStyles.card,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Logo />

          {/* Green circle check icon */}
          <View style={forgotPasswordStyles.successIconWrapper}>
            <View style={forgotPasswordStyles.successIconOuter}>
              <View style={forgotPasswordStyles.successIconInner}>
                <Text style={forgotPasswordStyles.successCheckmark}>✓</Text>
              </View>
            </View>
          </View>

          <View style={forgotPasswordStyles.headerSection}>
            <Text style={forgotPasswordStyles.title}>Check your email</Text>
            <Text style={forgotPasswordStyles.subtitle}>
              We've sent a password reset link to{' '}
              <Text style={forgotPasswordStyles.emailHighlight}>{email}</Text>
              {'. '}The link expires in 15 minutes.
            </Text>
          </View>

          {/* Didn't receive it section */}
          <View style={forgotPasswordStyles.didntReceiveBox}>
            <Text style={forgotPasswordStyles.didntReceiveTitle}>Didn't receive it?</Text>
            <View style={forgotPasswordStyles.tipList}>
              <View style={forgotPasswordStyles.tipRow}>
                <Text style={forgotPasswordStyles.tipBullet}>•</Text>
                <Text style={forgotPasswordStyles.tipText}>Check your spam or junk folder</Text>
              </View>
              <View style={forgotPasswordStyles.tipRow}>
                <Text style={forgotPasswordStyles.tipBullet}>•</Text>
                <Text style={forgotPasswordStyles.tipText}>
                  Make sure you typed the correct email
                </Text>
              </View>
              <View style={forgotPasswordStyles.tipRow}>
                <Text style={forgotPasswordStyles.tipBullet}>•</Text>
                <Text style={forgotPasswordStyles.tipText}>
                  Wait a few minutes and try again
                </Text>
              </View>
            </View>
          </View>

          {/* Resend */}
          <TouchableOpacity
            onPress={handleResendEmail}
            disabled={loading}
            activeOpacity={0.7}
            style={forgotPasswordStyles.resendRow}
          >
            {loading ? (
              <ActivityIndicator color="#5B4FCF" size="small" />
            ) : (
              <Text style={forgotPasswordStyles.resendText}>Resend available in 45s</Text>
            )}
          </TouchableOpacity>

          {/* Back to login */}
          <TouchableOpacity
            style={forgotPasswordStyles.backRow}
            onPress={handleBackToLogin}
            activeOpacity={0.7}
          >
            <Text style={forgotPasswordStyles.backArrow}>←</Text>
            <Text style={forgotPasswordStyles.backText}> Back to login</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
