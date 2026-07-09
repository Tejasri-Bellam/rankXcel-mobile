import { getMeService, updateMeService, changePasswordService } from '@/src/libs/services/profile';
import { profileStyles } from '@/src/styles/styles/home/profilescreenstyles';
import { COLORS } from '@/src/styles/styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, View, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';

// Section Header
const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={profileStyles.sectionHeader}>
    <Text style={profileStyles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={profileStyles.sectionSubtitle}>{subtitle}</Text> : null}
  </View>
);

// Labeled Input
const LabeledInput = ({
  label, value, onChangeText, placeholder, keyboardType, disabled = false,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: any; disabled?: boolean;
}) => (
  <View style={profileStyles.inputGroup}>
    <Text style={profileStyles.inputLabel}>{label}</Text>
    <View style={[profileStyles.inputWrap, disabled && { backgroundColor: '#f2f2f2', opacity: 0.7 }]}>
      {label === 'Phone Number' && (
        <Ionicons name="call-outline" size={15} color={COLORS.textLight} style={profileStyles.inputIcon} />
      )}
      <TextInput
        style={[profileStyles.textInput, label === 'Phone Number' && { paddingLeft: 32 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        keyboardType={keyboardType || 'default'}
        editable={!disabled}
      />
    </View>
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

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
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
      setPhone(userData?.phone || '');
    } catch {
      Alert.alert('Error', 'Failed to load profile data');
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

      const payload = {
        name: name.trim(),
        phone,
      };

      await updateMeService(payload);

      Alert.alert('Success', 'Profile updated successfully');
      fetchProfile();
    } catch {
      Alert.alert('Un-success', 'Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  const closePasswordModal = () => {
    setPasswordOpen(false);
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setPwdError('');
    setShowCurrentPwd(false);
    setShowNewPwd(false);
    setShowConfirmPwd(false);
  };

  const handleUpdatePassword = async () => {
    setPwdError('');
    if (!currentPwd) { setPwdError('Please enter your current password.'); return; }
    if (newPwd.length < 8) { setPwdError('New password must be at least 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match.'); return; }

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
      const errors = err?.errors ?? {};
      const message =
        errors.old_password?.[0] ||
        errors.new_password?.[0] ||
        errors.confirm_password?.[0] ||
        errors.nonFieldErrors?.[0] ||
        'Failed to change password. Please try again.';
      setPwdError(message);
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
          <LabeledInput label="Full Name" value={name} onChangeText={setname} placeholder="Your full name" />
          <LabeledInput label="Phone Number" value={phone} onChangeText={setPhone} placeholder="9876543210" keyboardType="phone-pad" />
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
                <TextInput style={profileStyles.pwdInput} value={currentPwd} onChangeText={setCurrentPwd} placeholder="Enter current password" placeholderTextColor={COLORS.textLight} secureTextEntry={!showCurrentPwd} />
                <TouchableOpacity style={profileStyles.eyeBtn} onPress={() => setShowCurrentPwd(!showCurrentPwd)}>
                  <Ionicons name={showCurrentPwd ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              <Text style={[profileStyles.inputLabel, { marginTop: 12 }]}>New Password</Text>
              <View style={profileStyles.pwdInputRow}>
                <TextInput style={profileStyles.pwdInput} value={newPwd} onChangeText={setNewPwd} placeholder="At least 8 characters" placeholderTextColor={COLORS.textLight} secureTextEntry={!showNewPwd} />
                <TouchableOpacity style={profileStyles.eyeBtn} onPress={() => setShowNewPwd(!showNewPwd)}>
                  <Ionicons name={showNewPwd ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              <Text style={[profileStyles.inputLabel, { marginTop: 12 }]}>Confirm New Password</Text>
              <View style={profileStyles.pwdInputRow}>
                <TextInput style={profileStyles.pwdInput} value={confirmPwd} onChangeText={setConfirmPwd} placeholder="Repeat new password" placeholderTextColor={COLORS.textLight} secureTextEntry={!showConfirmPwd} />
                <TouchableOpacity style={profileStyles.eyeBtn} onPress={() => setShowConfirmPwd(!showConfirmPwd)}>
                  <Ionicons name={showConfirmPwd ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              {pwdError !== '' && <Text style={profileStyles.pwdError}>{pwdError}</Text>}

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
