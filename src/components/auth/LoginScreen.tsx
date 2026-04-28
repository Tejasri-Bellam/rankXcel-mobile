import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { loginData } from '../json/login';
import { loginStyles } from '@/src/styles/auth/loginStyles';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    const validEmail = loginData.auth.email;
    const validPassword = loginData.auth.password;

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (
      email.trim().toLowerCase() === validEmail &&
      password === validPassword
    ) {
      // Navigate to welcome page on successful login
      router.push('../welcome');
    } else {
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={loginStyles.keyboardView}
    >
      <ScrollView style={loginStyles.container}>
        <TouchableOpacity
          style={loginStyles.backButton}
          onPress={() => router.back()}
        >
          <Text style={loginStyles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={loginStyles.content}>
          <Text style={loginStyles.logo}>{loginData.logo}</Text>
          <Text style={loginStyles.title}>{loginData.title}</Text>
          <Text style={loginStyles.subtitle}>{loginData.subtitle}</Text>

          <View style={loginStyles.form}>
            <View style={loginStyles.inputGroup}>
              <Text style={loginStyles.label}>{loginData.labels.email}</Text>
              <TextInput
                style={loginStyles.input}
                placeholder={loginData.placeholders.email}
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={loginStyles.inputGroup}>
              <View style={loginStyles.passwordHeader}>
                <Text style={loginStyles.label}>
                {loginData.labels.password}
              </Text>
                <TouchableOpacity
                  onPress={() => router.push('../../forgot-password')}
                >
                  <Text style={loginStyles.forgotPassword}>
                    {loginData.buttons.forgotPassword}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={loginStyles.input}
                placeholder={loginData.placeholders.password}
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={loginStyles.loginButton} onPress={handleLogin}>
              <Text style={loginStyles.loginButtonText}>
              {loginData.buttons.login}
            </Text>
            </TouchableOpacity>

            <View style={loginStyles.signupLink}>
              <Text style={loginStyles.signupText}>
              {loginData.footer.text}
            </Text>
              <TouchableOpacity onPress={() => router.push('../signup')}>
                <Text style={loginStyles.signupLinkText}>
                {loginData.buttons.signup}
              </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;