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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignupJson } from '../json/signup';
import { signupStyles } from '@/src/styles/auth/signupStyles';
import { router } from 'expo-router';
import { signupService } from '@/src/libs/services/auth';


const SignupScreen= () => {
  const signupData = SignupJson();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
  if (!fullName || !email || !mobileNumber || !password || !confirmPassword) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match');
    return;
  }

  if (password.length < 8) {
    Alert.alert('Error', 'Password must be at least 8 characters');
    return;
  }

  if (!agreeTerms) {
    Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
    return;
  }

  setLoading(true);

  try {
    const payload = {
      name: fullName,
      email: email.trim().toLowerCase(),
      phone: mobileNumber,
      password: password,
      confirm_password: confirmPassword
    };

    const response = await signupService(payload);

    console.log("Signup Response:", response);

    Alert.alert('Success', 'Account created successfully!');

    // Navigate to login
    router.replace({
    pathname: '../../auth/verify-email',
    params: { email: email.trim().toLowerCase() },
  });

  } catch (error: any) {
    console.error("Signup Error:", error);

    Alert.alert(
      'Signup Failed',
      error?.response?.data?.message || 'Something went wrong'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={signupStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={signupStyles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity 
            style={signupStyles.backButton}
            onPress={() => router.back()}
          >
            <Text style={signupStyles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={signupStyles.content}>
            <Text style={signupStyles.logo}>{signupData.app.logo}</Text>
            <Text style={signupStyles.title}>{signupData.headings.title}</Text>
            <Text style={signupStyles.subtitle}>Start your exam preparation with precision diagnostics.</Text>

            <View style={signupStyles.form}>
              <View style={signupStyles.inputGroup}>
                <Text style={signupStyles.label}>Full name</Text>
                <TextInput
                  style={signupStyles.input}
                  placeholder={signupData.placeholders.fullName}
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={signupStyles.inputGroup}>
                <Text style={signupStyles.label}>Email address</Text>
                <TextInput
                  style={signupStyles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={signupStyles.inputGroup}>
                <Text style={signupStyles.label}>Mobile number</Text>
                <TextInput
                  style={signupStyles.input}
                  placeholder="9876543210"
                  placeholderTextColor="#9CA3AF"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                />
                <Text style={signupStyles.inputHint}>10 digit mobile number</Text>
              </View>

              <View style={signupStyles.inputGroup}>
                <Text style={signupStyles.label}>Password</Text>
                <TextInput
                  style={signupStyles.input}
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={signupStyles.inputGroup}>
                <Text style={signupStyles.label}>Confirm password</Text>
                <TextInput
                  style={signupStyles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity 
                style={signupStyles.checkboxContainer}
                onPress={() => setAgreeTerms(!agreeTerms)}
              >
                <View style={[signupStyles.checkbox, agreeTerms && signupStyles.checkboxChecked]}>
                  {agreeTerms && <Text style={signupStyles.checkmark}>✓</Text>}
                </View>
                <Text style={signupStyles.checkboxLabel}>
                  I agree to the Terms of Service and Privacy Policy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={signupStyles.createButton}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={signupStyles.createButtonText}>
                  {loading ? 'Creating...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              <View style={signupStyles.loginLink}>
                <Text style={signupStyles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text style={signupStyles.loginLinkText}>Log in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;