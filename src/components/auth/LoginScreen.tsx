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
import { googleLoginService, loginService } from '@/src/libs/services/auth';
import {
  getCountriesService,
  getCountryService,
  normalizeUserCountry,
} from '@/src/libs/services/countries';
import { storageSetAccessToken, clearUserSession } from '@/src/libs/storage';
import { useTargetExam } from '@/src/libs/context/TagretExamContext';
import CountrySelect from '@/src/components/common/CountrySelect';
import Toast, { useToast } from '@/src/components/common/Toast';
import {
  EMAIL_REGEX,
  FieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '@/src/components/auth/authForm';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BRAND = 'RankXcel';

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

const LoginScreen = () => {
  // Used to drop any leftover in-memory exam state from a previous session, and
  // to load this user's country-scoped target exams right after login.
  const { reset: resetTargetExam, refreshExams } = useTargetExam();
  const { toast, showToast, hideToast } = useToast();

  // Country chosen via the header selector — used as a fallback when the
  // authenticated /get_country/ lookup can't resolve a country after login.
  const [selectedCountryId, setSelectedCountryId] = useState<
    number | string | null
  >(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

      showToast('Logged in successfully', 'success');
      await completeLogin(data);
    } catch (error: any) {
      console.log('LOGIN ERROR:', JSON.stringify(error, null, 2));
      setFieldErrors(getApiFieldErrors(error));
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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

      showToast('Logged in successfully', 'success');
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
      showToast(getApiErrorMessage(error) || 'Google sign-in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hideToast} />
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to keep your streak alive.</Text>

          {/* Tab switch */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, styles.tabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, styles.tabTextActive]}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => router.replace('/auth/sign-up')}
              activeOpacity={0.8}
            >
              <Text style={styles.tabText}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
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
                  placeholder="Your password"
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

            <TouchableOpacity
              onPress={() => router.push('../auth/forgot-password')}
            >
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Primary button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Logging in...' : 'Log in'}
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
