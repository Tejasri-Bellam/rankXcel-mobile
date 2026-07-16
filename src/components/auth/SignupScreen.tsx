import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
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
import * as AppleAuthentication from 'expo-apple-authentication';
import { loginStyles as styles } from '@/src/styles/styles/auth/loginstyles';
import {
  appleLoginService,
  googleLoginService,
  signupService,
} from '@/src/libs/services/auth';
import {
  getCountriesService,
  getCountryService,
  normalizeUserCountry,
  svgToDataUri,
} from '@/src/libs/services/countries';
import { storageSetAccessToken, clearUserSession } from '@/src/libs/storage';
import { useTargetExam } from '@/src/libs/context/TagretExamContext';
import { countrySelectStyles } from '@/src/styles/styles/common/countryselectstyles';
import InputField from '@/src/components/common/InputField';
import Toast, { useToast } from '@/src/components/common/Toast';
import {
  EMAIL_REGEX,
  FieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
  getNonFieldError,
} from '@/src/components/auth/authForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND } from '@/src/libs/constants';

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
// scope the target-exam catalogue (GET /target-exams/?country={id}).
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
  const countryId = idCandidates.find((v) => v != null && v !== '') ?? null;

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
      // The master's `flag` is raw SVG markup — convert it to a data URI so
      // the sidebar can render it (a raw <svg> string is not a usable image
      // source). Real flag URLs, if the API ever returns them, pass through.
      flagUrl:
        region.flagUrl ??
        svgToDataUri(match.flag_url ?? match.flagUrl ?? match.flag),
    };
  } catch {
    return region;
  }
};

export default function SignupScreen() {
  // Used to drop any leftover in-memory exam state from a previous session, and
  // to load this user's country-scoped target exams right after Google sign-in.
  const { reset: resetTargetExam, refreshExams } = useTargetExam();
  const { toast, showToast, hideToast } = useToast();

  // Device-location country used as a fallback when the authenticated
  // /get_country/ lookup can't resolve a country after Google sign-in.
  const [selectedCountryId, setSelectedCountryId] = useState<
    number | string | null
  >(null);

  // Device-location country shown in the top-right chip. Resolved from
  // GET /v1/get_country/ (no countries-options catalogue involved).
  const [country, setCountry] = useState<{
    id: number | string;
    name: string;
    isoCode2?: string;
  } | null>(null);

  // Detect the user's country from the device location once on mount so the
  // header reflects it and the post-signup data fetch can be scoped to it.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res: any = await getCountryService();
        const detected = normalizeUserCountry(res?.data);
        if (active && detected) {
          setCountry(detected);
          setSelectedCountryId(detected.id);
        }
      } catch {
        // Non-fatal — signup still works without a pre-detected country.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  // Tracks the in-flight social provider separately from `loading` so the
  // provider's own button shows the spinner instead of the "Create account"
  // button.
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(
    null
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Clears the inline error for a single field as the user edits it.
  const clearFieldError = (key: keyof FieldErrors) =>
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

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

  const handleSignup = async () => {
    const errors = validateSignup();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    if (!agreeTerms) {
      showToast(
        'Please agree to the Terms of Service and Privacy Policy',
        'error'
      );
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

      const res: any = await signupService(payload);

      showToast(
        res?.message || res?.data?.message || 'Account created successfully',
        'success'
      );

      // Give the success toast a moment before leaving for email verification.
      setTimeout(() => {
        router.replace({
          pathname: '../../auth/verify-email',
          params: { email: email.trim().toLowerCase() },
        });
      }, 800);
    } catch (error: any) {
      console.log('SIGNUP ERROR:', JSON.stringify(error, null, 2));
      const apiFieldErrors = getApiFieldErrors(error);
      setFieldErrors(apiFieldErrors);
      // Show the form-level message as a toast; pure field errors already render
      // below their inputs, so only toast a generic message when nothing mapped.
      const nonField = getNonFieldError(error);
      if (nonField) showToast(nonField, 'error');
      else if (!Object.keys(apiFieldErrors).length)
        showToast(getApiErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Post-authentication flow for Google sign-up: clear any stale session,
  // persist the new token + region, and route into the dashboard. Mirrors the
  // login screen so a Google account works the same whether the user starts
  // from log in or sign up.
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
    // selection to the first exam. Fire-and-forget: refreshExams sets its
    // in-flight guard synchronously, so the dashboard's own initial load is
    // deduped against this one.
    refreshExams(countryId ?? undefined);

    router.replace('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    setFieldErrors({});
    setSocialLoading('google');

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
      console.log('GOOGLE SIGNUP RESPONSE:', JSON.stringify(data, null, 2));

      showToast('Signed in successfully', 'success');
      await completeLogin(data);
    } catch (error: any) {
      // User-initiated cancellations are not errors worth surfacing.
      if (
        error?.code === statusCodes.SIGN_IN_CANCELLED ||
        error?.code === statusCodes.IN_PROGRESS
      ) {
        return;
      }
      console.log('GOOGLE SIGNUP ERROR:', JSON.stringify(error, null, 2));
      showToast(getApiErrorMessage(error) || 'Google sign-in failed', 'error');
    } finally {
      setSocialLoading(null);
    }
  };

  // Sign in with Apple (iOS only). The native sheet returns a signed identity
  // token (JWT) we forward to the backend as `identity_token` (the field apple_sso requires).
  const handleAppleSignIn = async () => {
    setFieldErrors({});
    setSocialLoading('apple');

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const identityToken = credential.identityToken;
      if (!identityToken) {
        throw new Error('No identityToken returned from Apple');
      }

      // Apple only returns the name/email on the FIRST authorization for an
      // Apple ID; forward them when present so the backend can capture them on
      // first sign-up. Subsequent logins rely on the token alone.
      const payload: Record<string, any> = { identity_token: identityToken };
      if (credential.fullName?.givenName)
        payload.first_name = credential.fullName.givenName;
      if (credential.fullName?.familyName)
        payload.last_name = credential.fullName.familyName;
      if (credential.email) payload.email = credential.email;

      const { data } = (await appleLoginService(payload)) as { data: any };
      console.log('APPLE SIGNUP RESPONSE:', JSON.stringify(data, null, 2));

      showToast('Signed in successfully', 'success');
      await completeLogin(data);
    } catch (error: any) {
      // User dismissed the Apple sheet — not an error worth surfacing.
      if (error?.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      console.log('APPLE SIGNUP ERROR:', JSON.stringify(error, null, 2));
      showToast(getApiErrorMessage(error) || 'Apple sign-in failed', 'error');
    } finally {
      setSocialLoading(null);
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
          {/* Header: back button (left) + country chip (top-right) */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/')}
            >
              <Ionicons name="chevron-back" size={20} color="#2F8AF4" />
            </TouchableOpacity>
            <View style={countrySelectStyles.chip}>
              <Ionicons name="location-outline" size={16} color="#475569" />
              <Text style={countrySelectStyles.chipText}>
                {country?.name ?? 'Region'}
              </Text>
            </View>
          </View>

          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="flash" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>{BRAND}</Text>
          </View>

          {/* Headings */}
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Start your exam preparation with precision diagnostics.
          </Text>

          {/* Tab switch */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => router.replace('/auth/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.tabText}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, styles.tabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, styles.tabTextActive]}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <InputField
              label="Full name"
              required
              icon="person-outline"
              placeholder="Arjun Mehta"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                clearFieldError('fullName');
              }}
              error={fieldErrors.fullName}
            />

            <InputField
              label="Email"
              required
              icon="mail-outline"
              placeholder="you@email.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                clearFieldError('email');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={fieldErrors.email}
            />

            <InputField
              label="Mobile number"
              required
              icon="call-outline"
              placeholder="9876543210"
              value={mobileNumber}
              onChangeText={(t) => {
                setMobileNumber(t);
                clearFieldError('mobileNumber');
              }}
              keyboardType="phone-pad"
              error={fieldErrors.mobileNumber}
              hint="10 digit mobile number"
              maxLength={10}
            />

            <InputField
              label="Password"
              required
              icon="lock-closed-outline"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                clearFieldError('password');
              }}
              password
              error={fieldErrors.password}
            />

            <InputField
              label="Confirm password"
              required
              icon="lock-closed-outline"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                clearFieldError('confirmPassword');
              }}
              password
              error={fieldErrors.confirmPassword}
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.8}
            >
              <View
                style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}
              >
                {agreeTerms && (
                  <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the Terms of Service and Privacy Policy
              </Text>
            </TouchableOpacity>

            {/* Primary button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSignup}
              disabled={loading || socialLoading !== null}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creating...' : 'Create account'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social buttons */}
            {/* Sign in with Apple is only available on iOS. */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                activeOpacity={0.85}
                onPress={handleAppleSignIn}
                disabled={loading || socialLoading !== null}
              >
                <Ionicons
                  name="logo-apple"
                  size={20}
                  color="#FFFFFF"
                  style={styles.socialIcon}
                />
                <Text style={styles.appleButtonText}>
                  {socialLoading === 'apple'
                    ? 'Signing in...'
                    : 'Continue with Apple'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              activeOpacity={0.85}
              onPress={handleGoogleSignIn}
              disabled={loading || socialLoading !== null}
            >
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleButtonText}>
                {socialLoading === 'google'
                  ? 'Signing in...'
                  : 'Continue with Google'}
              </Text>
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