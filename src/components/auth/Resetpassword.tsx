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
import { router, useLocalSearchParams } from 'expo-router';
import { resetPasswordConfirmService } from '@/src/libs/services/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resetPasswordStyles } from '@/src/styles/auth/resetPasswordStyles';

// Main Screen
export default function ResetPasswordConfirmScreen() {
  const { uidb64, token } = useLocalSearchParams<{ uidb64: string; token: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  // Password strength indicator
  const getPasswordStrength = (pwd: string): { label: string; color: string; pct: number } => {
    if (pwd.length === 0) return { label: '', color: '#E5E7EB', pct: 0 };
    if (pwd.length < 6) return { label: 'Too short', color: '#EF4444', pct: 20 };
    if (pwd.length < 8) return { label: 'Weak', color: '#F97316', pct: 40 };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score === 3) return { label: 'Strong', color: '#22C55E', pct: 100 };
    if (score === 2) return { label: 'Good', color: '#3B82F6', pct: 75 };
    return { label: 'Fair', color: '#EAB308', pct: 55 };
  };

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  // Handler
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (!uidb64 || !token) {
      Alert.alert('Error', 'Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordConfirmService(uidb64, token, {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.response?.data?.new_password?.[0] ||
          'Failed to reset password. The link may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Logo
  const Logo = () => (
    <View style={resetPasswordStyles.logoContainer}>
      <View style={resetPasswordStyles.logoBox}>
        <Text style={resetPasswordStyles.logoText}>RX</Text>
      </View>
      <Text style={resetPasswordStyles.logoLabel}>RankXcel</Text>
    </View>
  );

  // Success state
  if (success) {
    return (
      <View style={resetPasswordStyles.safeArea}>
        <ScrollView contentContainerStyle={resetPasswordStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[resetPasswordStyles.card, { opacity: fadeAnim }]}>
            <Logo />
            <View style={resetPasswordStyles.successIconWrapper}>
              <View style={resetPasswordStyles.successIconOuter}>
                <View style={resetPasswordStyles.successIconInner}>
                  <Text style={resetPasswordStyles.successCheckmark}>✓</Text>
                </View>
              </View>
            </View>
            <Text style={resetPasswordStyles.title}>Password Updated!</Text>
            <Text style={resetPasswordStyles.subtitle}>
              Your password has been reset successfully. You can now log in with your new password.
            </Text>
            <TouchableOpacity
              style={resetPasswordStyles.primaryBtn}
              onPress={() => router.replace('/auth/login')}
              activeOpacity={0.85}
            >
              <Text style={resetPasswordStyles.primaryBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // Main form
  return (
    <View style={resetPasswordStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={resetPasswordStyles.flex}
      >
        <ScrollView
          contentContainerStyle={resetPasswordStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              resetPasswordStyles.card,
              { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
            ]}
          >
            <Logo />

            <View style={resetPasswordStyles.headerSection}>
              <Text style={resetPasswordStyles.title}>Create New Password</Text>
              <Text style={resetPasswordStyles.subtitle}>
                Your new password must be different from your previous password.
              </Text>
            </View>

            <View style={resetPasswordStyles.form}>
              {/* New password */}
              <View style={resetPasswordStyles.inputGroup}>
                <Text style={resetPasswordStyles.label}>
                  New Password <Text style={resetPasswordStyles.required}>*</Text>
                </Text>
                <View style={resetPasswordStyles.inputWrapper}>
                  <TextInput
                    style={resetPasswordStyles.textInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={resetPasswordStyles.eyeBtn}
                    onPress={() => setShowNew(!showNew)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={resetPasswordStyles.eyeIcon}>{showNew ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Strength bar */}
                {newPassword.length > 0 && (
                  <View style={resetPasswordStyles.strengthWrapper}>
                    <View style={resetPasswordStyles.strengthBg}>
                      <View
                        style={[
                          resetPasswordStyles.strengthFill,
                          { width: `${strength.pct}%` as any, backgroundColor: strength.color },
                        ]}
                      />
                    </View>
                    <Text style={[resetPasswordStyles.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm password */}
              <View style={resetPasswordStyles.inputGroup}>
                <Text style={resetPasswordStyles.label}>
                  Confirm Password <Text style={resetPasswordStyles.required}>*</Text>
                </Text>
                <View
                  style={[
                    resetPasswordStyles.inputWrapper,
                    passwordsMismatch && resetPasswordStyles.inputWrapperError,
                    passwordsMatch && resetPasswordStyles.inputWrapperSuccess,
                  ]}
                >
                  <TextInput
                    style={resetPasswordStyles.textInput}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={resetPasswordStyles.eyeBtn}
                    onPress={() => setShowConfirm(!showConfirm)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={resetPasswordStyles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {passwordsMismatch && (
                  <Text style={resetPasswordStyles.errorText}>Passwords do not match</Text>
                )}
              </View>

              <TouchableOpacity
                style={[resetPasswordStyles.primaryBtn, loading && resetPasswordStyles.primaryBtnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={resetPasswordStyles.primaryBtnText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={resetPasswordStyles.backRow}
                onPress={() => router.replace('/auth/login')}
                activeOpacity={0.7}
              >
                <Text style={resetPasswordStyles.backArrow}>←</Text>
                <Text style={resetPasswordStyles.backText}> Back to login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
