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
import { loginService } from '@/src/libs/services/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storageSetAccessToken } from '@/src/libs/storage';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);


const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

  setLoading(true);

  try {
    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };

    const { data } = await loginService(payload) as { data: { token?: string } };
console.log('d', data);

    console.log("LOGIN RESPONSE:", data);
    if (data?.token) {
      await storageSetAccessToken(data?.token);
      console.log("Access token stored successfully:", data?.token);
    }

      router.push('/dashboard');
    } 
    catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={loginStyles.container}>
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
                  onPress={() => router.push('../auth/forgot-password')}
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

            <TouchableOpacity
              style={loginStyles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={loginStyles.loginButtonText}>
                {loading ? 'Logging in...' : loginData.buttons.login}
              </Text>
            </TouchableOpacity>

            <View style={loginStyles.signupLink}>
              <Text style={loginStyles.signupText}>
                {loginData.footer.text}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
                <Text style={loginStyles.signupLinkText}>
                  {loginData.buttons.signup}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;