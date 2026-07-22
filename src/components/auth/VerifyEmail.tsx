import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { resendOtpService, verifyEmailService } from '@/src/libs/services/auth';
import { storageSetAccessToken } from '@/src/libs/storage';
import { verifyEmailStyles as styles } from '@/src/styles/styles/auth/verifyemailstyles';
import { getApiErrorMessage } from './authForm';
import { parseApiError, getFieldError } from '@/src/libs/utils/apiError';

const OTP_LENGTH = 6;

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    if (value.length > 1) {
      const digits = value.split('').slice(0, OTP_LENGTH - index);
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!email) {
      Alert.alert("Error", "Email not found");
      return;
    }

    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }

    setOtpError('');
    setLoading(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        otp: code,
      };

      const response = await verifyEmailService(payload);
      console.log('Verify Email Response:', response);

      // Auto-login the freshly verified account so the user never has to
      // log in manually — store whatever token shape the API returns.
      const resData: any = (response as any)?.data ?? {};
      const token =
        resData.token ??
        resData.access ??
        resData.access_token ??
        resData.key ??
        resData.user?.token;
      if (token) {
        await storageSetAccessToken(token);
      }

      Alert.alert('Success', 'Email verified successfully!', [
        { text: 'OK', onPress: () => router.replace('/set-goal') },
      ]);
    } catch (error: any) {
      console.log('VERIFY ERROR:', JSON.stringify(error, null, 2));
      // Show OTP-specific errors below the code boxes; anything else in an Alert.
      const parsed = parseApiError(error);
      const codeErr = getFieldError(parsed, 'otp', 'code', 'token');
      if (codeErr) setOtpError(codeErr);
      else if (parsed.nonFieldError) setOtpError(parsed.nonFieldError);
      else
        Alert.alert(
          'Verification Failed',
          getApiErrorMessage(error, 'Invalid or expired code. Please try again.')
        );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    if (!email) {
      Alert.alert("Error", "Email not found");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        purpose: 'registration',
      };

      const response = await resendOtpService(payload);
      console.log('Resend OTP Response:', response);

      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();

      setResendTimer(30);
      setCanResend(false);
    } catch (error: any) {
      console.log('RESEND ERROR:', JSON.stringify(error, null, 2));
      Alert.alert('Error', getApiErrorMessage(error, 'Failed to resend OTP'));
    } finally {
      setLoading(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length))
    : 'your email';

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>RX</Text>
          </View>
          <Text style={styles.appName}>RankXcel</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.emailIcon}>✉️</Text>
          </View>

          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{' '}
            <Text style={styles.emailText}>{maskedEmail}</Text>.{'\n'}
            Enter it below to verify your account.
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                ]}
                value={digit}
                onChangeText={(val) => { if (otpError) setOtpError(''); handleOtpChange(val, index); }}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1} // ✅ FIXED
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {!!otpError && (
            <Text style={{ marginTop: 4, marginBottom: 4, fontSize: 12, color: '#EF4444', fontWeight: '500', textAlign: 'center' }}>
              {otpError}
            </Text>
          )}

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.resendText}>Resend OTP in </Text>
                <Text style={styles.timerText}>{resendTimer}s</Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.replace('/auth/sign-up')}
          >
            <Text style={styles.backLinkText}>← Back to registration</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};