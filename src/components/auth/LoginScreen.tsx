import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { loginStyles as styles } from '@/src/styles/auth/loginStyles';
import { googleLoginService, loginService, signupService } from '@/src/libs/services/auth';
import {
  getCountriesService,
  getCountryService,
  normalizeUserCountry,
} from '@/src/libs/services/countries';
import { storageSetAccessToken, clearUserSession } from '@/src/libs/storage';
import { useTargetExam } from '@/src/libs/context/TagretExamContext';
import CountrySelect from '@/src/components/common/CountrySelect';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthMode = 'login' | 'signup';

interface AuthScreenProps {
  initialMode?: AuthMode;
}

const BRAND = 'RankXcel';

type FieldErrors = {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Maps server-side field keys (snake_case payload keys) to our local field names.
const SERVER_FIELD_MAP: Record<string, keyof FieldErrors> = {
  name: 'fullName',
  full_name: 'fullName',
  email: 'email',
  phone: 'mobileNumber',
  mobile: 'mobileNumber',
  password: 'password',
  confirm_password: 'confirmPassword',
};

// The axios interceptor (api.ts) rejects with a custom shape:
// { status, errors: Record<string, string[]>, body: rawResponseData }.
// Validation errors arrive as body.fields = { email: ["..."] }.
const getApiFieldErrors = (err: any): FieldErrors => {
  const fields = (err?.body ?? err?.response?.data)?.fields;
  const result: FieldErrors = {};
  if (fields && typeof fields === 'object') {
    for (const [key, value] of Object.entries(fields)) {
      const localKey = SERVER_FIELD_MAP[key];
      const msg = Array.isArray(value) ? value[0] : value;
      if (localKey && typeof msg === 'string') result[localKey] = msg;
    }
  }
  return result;
};

// Pull the most human-readable message out of the error (falling back to the
// raw axios shape, just in case).
const getApiErrorMessage = (err: any): string => {
  const body = err?.body ?? err?.response?.data;
  // Prefer a specific field-level validation message.
  const fields = body?.fields;
  if (fields && typeof fields === 'object') {
    for (const value of Object.values(fields)) {
      const msg = Array.isArray(value) ? value[0] : value;
      if (typeof msg === 'string') return msg;
    }
  }
  if (body && typeof body === 'object') {
    if (typeof body.error === 'string') return body.error;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.detail === 'string') return body.detail;
  }
  const errors = err?.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors).flat()[0];
    if (typeof first === 'string') return first;
  }
  return 'Something went wrong';
};

type LoginRegion = {
  name: string;
  currency?: string;
  flag?: string;
  flagUrl?: string;
};

// The login payload can carry the user's country in several shapes; grab
// whichever is present.
const pickRegionSource = (data: any): any =>
  data?.region ??
  data?.country ??
  data?.user?.region ??
  data?.user?.country ??
  data?.user?.country_detail ??
  null;

// Normalize the login response into a region object + the country id we need to
// scope the target-exam catalogue (GET /my-target-exams/?country={id}).
const normalizeLoginRegion = (
  data: any
): { region: LoginRegion; countryId: number | string | null } => {
  const src = pickRegionSource(data);
  const region: LoginRegion =
    typeof src === 'string'
      ? { name: src }
      : src
        ? {
            name: src.name ?? src.country_name ?? src.label ?? '',
            currency: src.currency ?? src.currency_code ?? undefined,
            flag: src.flag ?? src.emoji ?? undefined,
            flagUrl: src.flag_url ?? src.flagUrl ?? undefined,
          }
        : { name: '' };

  const idCandidates = [
    data?.country_id,
    data?.user?.country_id,
    typeof src === 'object' && src ? src.id : undefined,
    typeof src === 'object' && src ? src.country_id : undefined,
    typeof src === 'object' && src ? src.country?.id : undefined,
  ];
  const countryId =
    idCandidates.find((v) => v != null && v !== '') ?? null;

  return { region, countryId };
};

// get_country only returns { id, name, iso_code_2 }; the flag/currency live in
// the countries master. Look them up so the profile sidebar can render the flag.
const enrichRegionFromCatalogue = async (
  region: LoginRegion,
  countryId: number | string | null
): Promise<LoginRegion> => {
  if (region.flagUrl && region.currency) return region;
  try {
    const res: any = await getCountriesService();
    const payload = res?.data;
    const list: any[] = Array.isArray(payload)
      ? payload
      : payload?.results ?? payload?.data ?? payload?.countries ?? [];
    const match = list.find((c: any) => {
      if (countryId != null && String(c?.id) === String(countryId)) return true;
      return (
        String(c?.name ?? c?.country_name ?? c?.label ?? '').toLowerCase() ===
        region.name.toLowerCase()
      );
    });
    if (!match) return region;
    return {
      ...region,
      currency:
        region.currency ?? match.currency ?? match.currency_code ?? undefined,
      flagUrl:
        region.flagUrl ??
        match.flag_url ??
        match.flagUrl ??
        match.flag ??
        undefined,
    };
  } catch {
    return region;
  }
};

const LoginScreen = ({ initialMode = 'login' }: AuthScreenProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  // Used to drop any leftover in-memory exam state from a previous session, and
  // to load this user's country-scoped target exams right after login.
  const { reset: resetTargetExam, refreshExams } = useTargetExam();

  // Country chosen via the header selector — used as a fallback when the
  // authenticated /get_country/ lookup can't resolve a country after login.
  const [selectedCountryId, setSelectedCountryId] = useState<
    number | string | null
  >(null);

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup state
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isLogin = mode === 'login';

  const switchMode = (next: AuthMode) => {
    setErrorMsg('');
    setFieldErrors({});
    setMode(next);
  };

  // Clears the inline error for a single field as the user edits it.
  const clearFieldError = (key: keyof FieldErrors) =>
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const validateLogin = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(email.trim()))
      errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    return errors;
  };

  const validateSignup = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(email.trim()))
      errors.email = 'Enter a valid email address';
    if (!mobileNumber.trim()) errors.mobileNumber = 'Mobile number is required';
    else if (!/^\d{10}$/.test(mobileNumber.trim()))
      errors.mobileNumber = 'Enter a valid 10 digit mobile number';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8)
      errors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword)
      errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  // Shared post-authentication flow used by both password login and Google
  // sign-in: clear any stale session, persist the new token + region, and route
  // into the dashboard.
  const completeLogin = async (data: any) => {
    // Safety net: clear any data left behind by a previous session before
    // storing the new one. A clean logout already does this, but the app may
    // have been killed mid-session — without this, the new student could
    // inherit the previous student's cached exam selection and dashboard.
    await clearUserSession();
    resetTargetExam();

    if (data?.token) {
      await storageSetAccessToken(data?.token);
    }

    // The login response doesn't carry the country, so fetch it from
    // /v1/get_country/. The country id scopes the whole catalogue (target
    // exams → mocks, syllabus, live tests). Fall back to anything the login
    // response happens to include if the call fails.
    let region: LoginRegion = { name: '' };
    let countryId: number | string | null = null;
    try {
      const countryRes: any = await getCountryService();
      const userCountry = normalizeUserCountry(countryRes?.data);
      if (userCountry) {
        countryId = userCountry.id;
        region = { name: userCountry.name };
      }
    } catch {
      // Non-fatal — fall back to the login payload below.
    }
    if (countryId == null) {
      const fallback = normalizeLoginRegion(data);
      region = fallback.region;
      countryId = fallback.countryId;
    }
    // Last resort: honour whatever the user picked in the header selector.
    if (countryId == null && selectedCountryId != null) {
      countryId = selectedCountryId;
    }
    // Resolve flag/currency from the countries master for the sidebar.
    if (region.name) {
      region = await enrichRegionFromCatalogue(region, countryId);
    }

    // Persist the region (incl. id when known) so the profile sidebar shows it
    // and later refreshes keep scoping the catalogue to the same country.
    if (region.name) {
      await AsyncStorage.setItem(
        'region',
        JSON.stringify(countryId != null ? { ...region, id: countryId } : region)
      );
    }
    if (countryId != null) {
      await AsyncStorage.setItem('regionCountryId', String(countryId));
    }
    if (data?.user) {
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
    }

    // Load this student's target exams scoped to their country, defaulting the
    // selection to the first exam. Mocks / syllabus / live tests all follow
    // the selected target exam. Fire-and-forget: refreshExams sets its
    // in-flight guard synchronously, so the dashboard's own initial load is
    // deduped against this one.
    refreshExams(countryId ?? undefined);

    router.replace('/dashboard');
  };

  const handleLogin = async () => {
    setErrorMsg('');
    const errors = validateLogin();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password,
      };

      const { data } = (await loginService(payload)) as { data: any };
      console.log('LOGIN RESPONSE:', JSON.stringify(data, null, 2));

      await completeLogin(data);
    } catch (error: any) {
      console.log('LOGIN ERROR:', JSON.stringify(error, null, 2));
      setFieldErrors(getApiFieldErrors(error));
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setErrorMsg('');
    const errors = validateSignup();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: fullName,
        email: email.trim().toLowerCase(),
        phone: mobileNumber,
        password,
        confirm_password: confirmPassword,
      };

      await signupService(payload);

      router.replace({
        pathname: '../../auth/verify-email',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (error: any) {
      console.log('SIGNUP ERROR:', JSON.stringify(error, null, 2));
      setFieldErrors(getApiFieldErrors(error));
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setFieldErrors({});
    setLoading(true);

    try {
      // Android only — verifies a usable Play Services is present. No-op on iOS.
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Sign out of any cached Google session first so the account picker /
      // consent screen always shows rather than silently reusing an account.
      try {
        await GoogleSignin.signOut();
      } catch {
        // Nothing was signed in — ignore.
      }

      const userInfo: any = await GoogleSignin.signIn();

      // The user dismissed the Google sheet.
      if (userInfo?.type === 'cancelled') {
        return;
      }

      // idToken lives under `.data` on newer SDKs, at the top level on older ones.
      const idToken: string | null =
        userInfo?.data?.idToken ?? userInfo?.idToken ?? null;
      if (!idToken) {
        throw new Error('No idToken returned from Google');
      }

      const { data } = (await googleLoginService({
        access_token: idToken,
      })) as { data: any };
      console.log('GOOGLE LOGIN RESPONSE:', JSON.stringify(data, null, 2));

      await completeLogin(data);
    } catch (error: any) {
      // User-initiated cancellations are not errors worth surfacing.
      if (
        error?.code === statusCodes.SIGN_IN_CANCELLED ||
        error?.code === statusCodes.IN_PROGRESS
      ) {
        return;
      }
      console.log('GOOGLE LOGIN ERROR:', JSON.stringify(error, null, 2));
      setErrorMsg(getApiErrorMessage(error) || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header: back button (left) + country selector (top-right) */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/')}
            >
              <Ionicons name="chevron-back" size={20} color="#2F8AF4" />
            </TouchableOpacity>
            <CountrySelect onChange={(c) => setSelectedCountryId(c.id)} />
          </View>

          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="flash" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>{BRAND}</Text>
          </View>

          {/* Headings */}
          <Text style={styles.title}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Log in to keep your streak alive.'
              : 'Start your exam preparation with precision diagnostics.'}
          </Text>

          {/* Tab switch */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => switchMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                Log in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => switchMode('signup')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {!!errorMsg && (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color="#DC2626"
                  style={styles.errorIcon}
                />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Full name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    fieldErrors.fullName && styles.inputWrapperError,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Arjun Mehta"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={(t) => {
                      setFullName(t);
                      clearFieldError('fullName');
                    }}
                  />
                </View>
                {!!fieldErrors.fullName && (
                  <Text style={styles.fieldError}>{fieldErrors.fullName}</Text>
                )}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  fieldErrors.email && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    clearFieldError('email');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {!!fieldErrors.email && (
                <Text style={styles.fieldError}>{fieldErrors.email}</Text>
              )}
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Mobile number <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    fieldErrors.mobileNumber && styles.inputWrapperError,
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="9876543210"
                    placeholderTextColor="#9CA3AF"
                    value={mobileNumber}
                    onChangeText={(t) => {
                      setMobileNumber(t);
                      clearFieldError('mobileNumber');
                    }}
                    keyboardType="phone-pad"
                  />
                </View>
                {fieldErrors.mobileNumber ? (
                  <Text style={styles.fieldError}>
                    {fieldErrors.mobileNumber}
                  </Text>
                ) : (
                  <Text style={styles.inputHint}>10 digit mobile number</Text>
                )}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Password <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  fieldErrors.password && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={isLogin ? 'Your password' : 'Min. 8 characters'}
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    clearFieldError('password');
                  }}
                  secureTextEntry
                />
              </View>
              {!!fieldErrors.password && (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              )}
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Confirm password <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    fieldErrors.confirmPassword && styles.inputWrapperError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      clearFieldError('confirmPassword');
                    }}
                    secureTextEntry
                  />
                </View>
                {!!fieldErrors.confirmPassword && (
                  <Text style={styles.fieldError}>
                    {fieldErrors.confirmPassword}
                  </Text>
                )}
              </View>
            )}

            {isLogin ? (
              <TouchableOpacity
                onPress={() => router.push('../auth/forgot-password')}
              >
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreeTerms && styles.checkboxChecked,
                  ]}
                >
                  {agreeTerms && (
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  I agree to the Terms of Service and Privacy Policy
                </Text>
              </TouchableOpacity>
            )}

            {/* Primary button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={isLogin ? handleLogin : handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {loading
                  ? isLogin
                    ? 'Logging in...'
                    : 'Creating...'
                  : isLogin
                  ? 'Log in'
                  : 'Create account'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social buttons */}
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              activeOpacity={0.85}
            >
              <Ionicons
                name="logo-apple"
                size={20}
                color="#FFFFFF"
                style={styles.socialIcon}
              />
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              activeOpacity={0.85}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Footer terms */}
            <Text style={styles.footerTerms}>
              By continuing you agree to our{' '}
              <Text style={styles.footerTermsLink}>Terms</Text> &{' '}
              <Text style={styles.footerTermsLink}>Privacy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
