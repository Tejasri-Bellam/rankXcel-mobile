import { getMeService, updateMeService, changePasswordService } from '@/src/libs/services/profile';
import { profileStyles } from '@/src/styles/styles/home/profilescreenstyles';
import { COLORS } from '@/src/styles/styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, View, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { parseApiError, getFieldError, getErrorMessage } from '@/src/libs/utils/apiError';

// Section Header
const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={profileStyles.sectionHeader}>
    <Text style={profileStyles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={profileStyles.sectionSubtitle}>{subtitle}</Text> : null}
  </View>
);

// Labeled Input
const LabeledInput = ({
  label, value, onChangeText, maxLength, placeholder, keyboardType, disabled = false, error, prefix,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  maxLength?: number; placeholder?: string; keyboardType?: any; disabled?: boolean; error?: string;
  // Static text rendered before the input, e.g. a "+91" dial code.
  prefix?: string;
}) => (
  <View style={profileStyles.inputGroup}>
    <Text style={profileStyles.inputLabel}>{label}</Text>
    <View style={[profileStyles.inputWrap, disabled && { backgroundColor: '#f2f2f2', opacity: 0.7 }]}>
      {label === 'Phone Number' && (
        <Ionicons name="call-outline" size={15} color={COLORS.textLight} style={profileStyles.inputIcon} />
      )}
      {!!prefix && <Text style={profileStyles.inputPrefix}>{prefix}</Text>}
      <TextInput
        style={[
          profileStyles.textInput,
          label === 'Phone Number' && { paddingLeft: prefix ? 62 : 32 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        maxLength={maxLength}
        placeholderTextColor={COLORS.textLight}
        keyboardType={keyboardType || 'default'}
        editable={!disabled}
      />
    </View>
    {!!error && <Text style={profileStyles.fieldError}>{error}</Text>}
  </View>
);

// Main Screen
export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Personal info
  const [name, setname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  // Server-side validation errors for the personal-info form.
  const [personalErrors, setPersonalErrors] = useState<{
    name?: string; phone?: string; form?: string;
  }>({});

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  // Per-field password errors (below each input) plus a form-level message.
  const [pwdErrors, setPwdErrors] = useState<{
    current?: string; new?: string; confirm?: string; form?: string;
  }>({});
  const [pwdLoading, setPwdLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Fetch profile
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const res = await getMeService();
      const userData: any = res?.data;

      setUser(userData);

      const fullName = userData?.name
        ? userData.name
        : `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim();
      setname(fullName);
      setEmail(userData?.email || '');
      // The API stores the full number with the +91 dial code; the input only
      // edits the bare 10-digit part (the +91 renders as a static prefix).
      setPhone((userData?.phone || '').replace(/^\+91/, ''));
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Failed to load profile data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Save personal info
  const handleSavePersonal = async () => {
    try {
      setSaveLoading(true);
      setPersonalErrors({});

      // Re-attach the +91 dial code the API expects (the input holds only the
      // bare 10-digit number).
      const payload = {
        name: name.trim(),
        phone: phone.trim() ? `+91${phone.trim()}` : '',
      };

      await updateMeService(payload);

      Alert.alert('Success', 'Profile updated successfully');
      fetchProfile();
    } catch (err: any) {
      // Show any field-level errors below the matching input; fall back to a
      // form-level message for anything else.
      const parsed = parseApiError(err);
      const nameErr = getFieldError(parsed, 'name', 'full_name', 'first_name');
      const phoneErr = getFieldError(parsed, 'phone', 'mobile', 'mobile_number');
      setPersonalErrors({
        name: nameErr,
        phone: phoneErr,
        form:
          parsed.nonFieldError ??
          (nameErr || phoneErr ? undefined : 'Failed to update profile'),
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const closePasswordModal = () => {
    setPasswordOpen(false);
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setPwdErrors({});
    setShowCurrentPwd(false);
    setShowNewPwd(false);
    setShowConfirmPwd(false);
  };

  const handleUpdatePassword = async () => {
    setPwdErrors({});
    if (!currentPwd) { setPwdErrors({ current: 'Please enter your current password.' }); return; }
    if (newPwd.length < 8) { setPwdErrors({ new: 'New password must be at least 8 characters.' }); return; }
    if (newPwd !== confirmPwd) { setPwdErrors({ confirm: 'Passwords do not match.' }); return; }

    try {
      setPwdLoading(true);

      await changePasswordService({
        old_password: currentPwd,
        new_password: newPwd,
        confirm_password: confirmPwd,
      });

      closePasswordModal();
      Alert.alert('Success', 'Your password has been changed successfully.');
    } catch (err: any) {
      // Map each server field error below its input; anything else becomes a
      // form-level message shown above the actions.
      const parsed = parseApiError(err);
      const current = getFieldError(parsed, 'old_password', 'current_password');
      const next = getFieldError(parsed, 'new_password', 'password');
      const confirm = getFieldError(parsed, 'confirm_password');
      setPwdErrors({
        current,
        new: next,
        confirm,
        form:
          parsed.nonFieldError ??
          (current || next || confirm
            ? undefined
            : 'Failed to change password. Please try again.'),
      });
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={profileStyles.safeArea}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.textLight }}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={profileStyles.safeArea}>
      <TouchableOpacity
        style={profileStyles.backButton}
        onPress={() => router.replace('/dashboard')}
      >
        <Ionicons
          name="arrow-back"
          size={18}
          color={COLORS.textDark}
        />
        <Text style={profileStyles.backText}>
          Profile
        </Text>
      </TouchableOpacity>

      <ScrollView
        style={profileStyles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={profileStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Profile Hero ── */}
        <View style={profileStyles.heroCard}>
          <View style={profileStyles.heroAvatar}>
            <Text style={profileStyles.heroAvatarText}>
              {(name || email || '?')
                .split(' ')
                .filter(Boolean)
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </Text>
          </View>
          <View style={profileStyles.heroInfo}>
            {name ? <Text style={profileStyles.heroName} numberOfLines={1}>{name}</Text> : null}
            {email ? <Text style={profileStyles.heroEmail} numberOfLines={1}>{email}</Text> : null}
            {user?.role ? (
              <View style={profileStyles.heroBadgeChip}>
                <Text style={profileStyles.heroBadgeText}>{user.role}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Personal Information ── */}
        <View style={profileStyles.card}>
          <SectionHeader title="Personal Information" subtitle="Update your name and contact details." />
          <LabeledInput label="Full Name" value={name} onChangeText={(t) => { setname(t); setPersonalErrors((p) => ({ ...p, name: undefined, form: undefined })); }} placeholder="Your full name" error={personalErrors.name} />
          <LabeledInput maxLength={10} label="Phone Number" prefix="+91" value={phone} onChangeText={(t) => { setPhone(t); setPersonalErrors((p) => ({ ...p, phone: undefined, form: undefined })); }} placeholder="9876543210" keyboardType="phone-pad" error={personalErrors.phone} />
          {!!personalErrors.form && <Text style={profileStyles.fieldError}>{personalErrors.form}</Text>}
          <TouchableOpacity style={profileStyles.saveBtn} onPress={handleSavePersonal} disabled={saveLoading}>
            {saveLoading
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Ionicons name="checkmark" size={16} color={COLORS.white} />
            }
            <Text style={profileStyles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        {/* ── Account Security ── */}
        <View style={profileStyles.card}>
          <SectionHeader title="Account Security" subtitle="Manage your password and login credentials." />

          <TouchableOpacity style={profileStyles.securityRow} onPress={() => setPasswordOpen(true)} activeOpacity={0.7}>
            <View style={profileStyles.securityIconWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={profileStyles.securityInfo}>
              <Text style={profileStyles.securityTitle}>Change Password</Text>
              <Text style={profileStyles.securitySub}>Update your login password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Change Password Modal ── */}
      <Modal
        visible={passwordOpen}
        transparent
        animationType="fade"
        onRequestClose={closePasswordModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={profileStyles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={profileStyles.modalCard}>
            <View style={profileStyles.modalHeader}>
              <View style={profileStyles.modalTitleWrap}>
                <View style={profileStyles.securityIconWrap}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={profileStyles.modalTitle}>Change Password</Text>
                  <Text style={profileStyles.modalSubtitle}>Update your login password</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closePasswordModal} style={profileStyles.modalCloseBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color={COLORS.textMedium} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={profileStyles.modalBody}
            >
              <Text style={profileStyles.inputLabel}>Current Password</Text>
              <View style={profileStyles.pwdInputRow}>
                <TextInput style={profileStyles.pwdInput} value={currentPwd} onChangeText={(t) => { setCurrentPwd(t); setPwdErrors((p) => ({ ...p, current: undefined, form: undefined })); }} placeholder="Enter current password" placeholderTextColor={COLORS.textLight} secureTextEntry={!showCurrentPwd} />
                <TouchableOpacity style={profileStyles.eyeBtn} onPress={() => setShowCurrentPwd(!showCurrentPwd)}>
                  <Ionicons name={showCurrentPwd ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
              {!!pwdErrors.current && <Text style={profileStyles.fieldError}>{pwdErrors.current}</Text>}

              <Text style={[profileStyles.inputLabel, { marginTop: 12 }]}>New Password</Text>
              <View style={profileStyles.pwdInputRow}>
                <TextInput style={profileStyles.pwdInput} value={newPwd} onChangeText={(t) => { setNewPwd(t); setPwdErrors((p) => ({ ...p, new: undefined, form: undefined })); }} placeholder="At least 8 characters" placeholderTextColor={COLORS.textLight} secureTextEntry={!showNewPwd} />
                <TouchableOpacity style={profileStyles.eyeBtn} onPress={() => setShowNewPwd(!showNewPwd)}>
                  <Ionicons name={showNewPwd ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
              {!!pwdErrors.new && <Text style={profileStyles.fieldError}>{pwdErrors.new}</Text>}

              <Text style={[profileStyles.inputLabel, { marginTop: 12 }]}>Confirm New Password</Text>
              <View style={profileStyles.pwdInputRow}>
                <TextInput style={profileStyles.pwdInput} value={confirmPwd} onChangeText={(t) => { setConfirmPwd(t); setPwdErrors((p) => ({ ...p, confirm: undefined, form: undefined })); }} placeholder="Repeat new password" placeholderTextColor={COLORS.textLight} secureTextEntry={!showConfirmPwd} />
                <TouchableOpacity style={profileStyles.eyeBtn} onPress={() => setShowConfirmPwd(!showConfirmPwd)}>
                  <Ionicons name={showConfirmPwd ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
              {!!pwdErrors.confirm && <Text style={profileStyles.fieldError}>{pwdErrors.confirm}</Text>}

              {!!pwdErrors.form && <Text style={profileStyles.pwdError}>{pwdErrors.form}</Text>}

              <View style={profileStyles.pwdActions}>
                <TouchableOpacity style={profileStyles.cancelPwdBtn} onPress={closePasswordModal}>
                  <Text style={profileStyles.cancelPwdBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={profileStyles.updatePwdBtn} onPress={handleUpdatePassword} disabled={pwdLoading}>
                  {pwdLoading
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Ionicons name="lock-closed" size={14} color={COLORS.white} />
                  }
                  <Text style={profileStyles.updatePwdBtnText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
