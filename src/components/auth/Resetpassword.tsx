import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { resetPasswordConfirmService } from '@/src/libs/services/auth';
import { resetPasswordStyles as styles } from '@/src/styles/auth/resetPasswordStyles';

const BRAND = 'RankXcel';

// Main Screen
export default function ResetPasswordConfirmScreen() {
  const { uidb64, token } = useLocalSearchParams<{ uidb64: string; token: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password strength indicator
  const getPasswordStrength = (pwd: string): { label: string; color: string; pct: number } => {
    if (pwd.length === 0) return { label: '', color: '#DCE6F4', pct: 0 };
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
      const response = await resetPasswordConfirmService(uidb64, token, {
        password: newPassword,
        confirm_password: confirmPassword,
      });
      console.log('RESET PASSWORD RESPONSE:', JSON.stringify(response, null, 2));
      setSuccess(true);
    } catch (error: any) {
      console.log('RESET PASSWORD ERROR:', JSON.stringify(error, null, 2));
      // The API interceptor rejects with { status, errors, body } — not an
      // axios error — so read the message off that shape.
      const apiErrors = error?.errors as Record<string, string[]> | undefined;
      const body = error?.body as Record<string, any> | undefined;
      const message =
        apiErrors?.password?.[0] ||
        apiErrors?.confirm_password?.[0] ||
        apiErrors?.token?.[0] ||
        apiErrors?.nonFieldErrors?.[0] ||
        (typeof body?.message === 'string' ? body.message : undefined) ||
        (typeof body?.detail === 'string' ? body.detail : undefined) ||
        'Failed to reset password. The link may have expired.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  // Back button
  const BackButton = () => (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => router.replace('/auth/login')}
      activeOpacity={0.7}
    >
      <Ionicons name="chevron-back" size={20} color="#2F8AF4" />
    </TouchableOpacity>
  );

  // Brand
  const Brand = () => (
    <View style={styles.brandRow}>
      <View style={styles.brandIcon}>
        <Ionicons name="flash" size={22} color="#FFFFFF" />
      </View>
      <Text style={styles.brandText}>{BRAND}</Text>
    </View>
  );

  // Success state
  if (success) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <BackButton />
          </View>
          <Brand />
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.subtitle}>
            Your password has been reset successfully. You can now log in with your new password.
          </Text>

          <View style={styles.successIconWrapper}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/auth/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Back to log in</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Main form
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <BackButton />
          </View>

          <Brand />

          <Text style={styles.title}>Create new password</Text>
          <Text style={styles.subtitle}>
            Your new password must be different from your previous password.
          </Text>

          <View style={styles.form}>
            {/* New password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                New password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
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
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showNew ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>

              {/* Strength bar */}
              {newPassword.length > 0 && (
                <View style={styles.strengthWrapper}>
                  <View style={styles.strengthBg}>
                    <View
                      style={[
                        styles.strengthFill,
                        { width: `${strength.pct}%` as any, backgroundColor: strength.color },
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
              <Text style={styles.label}>
                Confirm password <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  passwordsMismatch && styles.inputWrapperError,
                  passwordsMatch && styles.inputWrapperSuccess,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
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
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
              {passwordsMismatch && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Reset password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backRow}
              onPress={() => router.replace('/auth/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>← Back to log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
