import { forgotPasswordService } from "@/src/libs/services/auth";
import { forgotPasswordStyles } from "@/src/styles/styles/auth/forgotpasswordscreenstyles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Types

type Step = "email" | "checkEmail";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Resend countdown timer
  useEffect(() => {
    if (step !== "checkEmail") return;

    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  // Handlers

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await forgotPasswordService({
        email: email.trim().toLowerCase(),
      });

      setStep("checkEmail");
      setResendTimer(30);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to send reset link. Please try again.",
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
      setResendTimer(30);
      Alert.alert("Sent", "Reset link has been resent to your email.");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to resend. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/auth/login');
  };

  // Back button
  const BackButton = () => (
    <TouchableOpacity
      style={forgotPasswordStyles.backButton}
      onPress={handleBackToLogin}
      activeOpacity={0.7}
    >
      <Ionicons
        name="chevron-back"
        size={24}
        color="#6C63FF"
        style={forgotPasswordStyles.backButtonIcon}
      />
    </TouchableOpacity>
  );

  // Logo Component
  const Logo = () => (
    <View style={forgotPasswordStyles.logoRow}>
      <View style={forgotPasswordStyles.logoBox}>
        <Text style={forgotPasswordStyles.logoIcon}>⚡</Text>
      </View>
      <Text style={forgotPasswordStyles.logoLabel}>RankXcel</Text>
    </View>
  );

  // Email Step
  if (step === "email") {
    return (
      <View style={forgotPasswordStyles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={forgotPasswordStyles.flex}
        >
          <ScrollView
            contentContainerStyle={forgotPasswordStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BackButton />

            <Animated.View
              style={[
                forgotPasswordStyles.content,
                {
                  transform: [{ translateY: slideAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              <Logo />

              <View style={forgotPasswordStyles.headerSection}>
                <Text style={forgotPasswordStyles.title}>Reset password</Text>
                <Text style={forgotPasswordStyles.subtitle}>
                  {`We'll email you a secure reset link.`}
                </Text>
              </View>

              <View style={forgotPasswordStyles.form}>
                <View style={forgotPasswordStyles.inputGroup}>
                  <Text style={forgotPasswordStyles.label}>Email</Text>

                  <View
                    style={[
                      forgotPasswordStyles.inputWrapper,
                      emailFocused && forgotPasswordStyles.inputWrapperFocused,
                    ]}
                  >
                    <Text style={forgotPasswordStyles.inputIcon}>👤</Text>

                    <TextInput
                      style={forgotPasswordStyles.textInput}
                      placeholder="aanya@example.com"
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
                  style={[
                    forgotPasswordStyles.primaryBtn,
                    loading && forgotPasswordStyles.primaryBtnDisabled,
                  ]}
                  onPress={handleSendResetLink}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={forgotPasswordStyles.primaryBtnText}>
                      Send reset link
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Check Email Step
  return (
    <View style={forgotPasswordStyles.safeArea}>
      <ScrollView
        contentContainerStyle={forgotPasswordStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BackButton />

        <Animated.View
          style={[
            forgotPasswordStyles.content,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Logo />

          <View style={forgotPasswordStyles.headerSection}>
            <Text style={forgotPasswordStyles.title}>Reset password</Text>
            <Text style={forgotPasswordStyles.subtitle}>
              {`We'll email you a secure reset link.`}
            </Text>
          </View>

          {/* Green check icon */}
          <View style={forgotPasswordStyles.successIconWrapper}>
            <View style={forgotPasswordStyles.successIconBox}>
              <Text style={forgotPasswordStyles.successCheckmark}>✓</Text>
            </View>
          </View>

          <Text style={forgotPasswordStyles.checkTitle}>Check your inbox</Text>
          <Text style={forgotPasswordStyles.checkSubtitle}>
            A reset link is on its way to{" "}
            <Text style={forgotPasswordStyles.emailHighlight}>{email}</Text>.
          </Text>

          {/* Back to login */}
          <TouchableOpacity
            style={forgotPasswordStyles.secondaryBtn}
            onPress={handleBackToLogin}
            activeOpacity={0.85}
          >
            <Text style={forgotPasswordStyles.secondaryBtnText}>
              Back to log in
            </Text>
          </TouchableOpacity>

          {/* Resend */}
          <TouchableOpacity
            onPress={handleResendEmail}
            disabled={loading || resendTimer > 0}
            activeOpacity={0.7}
            style={forgotPasswordStyles.resendRow}
          >
            {loading ? (
              <ActivityIndicator color='#6C63FF' size="small" />
            ) : resendTimer > 0 ? (
              <Text style={forgotPasswordStyles.resendText}>
                Resend available in {resendTimer}s
              </Text>
            ) : (
              <Text style={forgotPasswordStyles.resendText}>Resend email</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
