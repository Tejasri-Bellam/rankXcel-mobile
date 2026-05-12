import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { resendOtpService, verifyEmailService } from '@/src/libs/services/auth';

const OTP_LENGTH = 6;

const VerifyEmailScreen = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
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
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);

    const payload = {
      email: email.trim().toLowerCase(),
      otp: code,
    };

    const response = await verifyEmailService(payload);
    console.log('Verify Email Response:', response);

    if (response.status === 200 || response.status === 201) {
      Alert.alert('Success', 'Email verified successfully!', [
        { text: 'OK', onPress: () => router.replace('/auth/login') },
      ]);
    } else {
      Alert.alert(
        'Verification Failed',
        response.data?.error || 'Invalid or expired code. Please try again.'
      );
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (!canResend) return;

    if (!email) {
      Alert.alert("Error", "Email not found");
      return;
    }

    setLoading(true);

    const payload = {
      email: email.trim().toLowerCase(),
    };

    const response = await resendOtpService(payload);
    console.log("Resend OTP Response:", response);

    if (response.status === 200 || response.status === 201) {
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();

      setResendTimer(30);
      setCanResend(false);

      Alert.alert('Success', 'Verification code resent successfully!');
    } else {
      Alert.alert(
        'Error',
        response.data?.error || 'Failed to resend OTP'
      );
    }

    setLoading(false);
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length))
    : 'your email';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
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
                onChangeText={(val) => handleOtpChange(val, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1} // ✅ FIXED
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

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
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>← Back to registration</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emailIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emailText: {
    color: '#111827',
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAFAFA',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timerText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
  },
  verifyButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default VerifyEmailScreen;