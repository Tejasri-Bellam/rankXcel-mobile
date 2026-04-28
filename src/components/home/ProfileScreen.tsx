import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Sidebar from '../common/Sidebar';
import { ProfileMenu } from '../common/ProfileMenu';
import Header from '../common/Header';
import { ProfileJson } from '../json/profile';
import { profileStyles } from '@/src/styles/sidebar/profileStyles';
import { COLORS } from '@/src/styles/styles';

const { width } = Dimensions.get('window');


// ─── Types ────────────────────────────────────────────────────────────────────

type ExamEntry = {
  id: number;
  name: string;
  year: string;
};

type NotifKey =
  | 'mockResults'
  | 'weeklyTips'
  | 'mockNotif'
  | 'practiceReminders'
  | 'productUpdates';

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={profileStyles.sectionHeader}>
    <Text style={profileStyles.sectionTitle}>{title}</Text>
    <Text style={profileStyles.sectionSubtitle}>{subtitle}</Text>
  </View>
);

// ─── Labeled Input ────────────────────────────────────────────────────────────

const LabeledInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
}) => (
  <View style={profileStyles.inputGroup}>
    <Text style={profileStyles.inputLabel}>{label}</Text>
    <View style={profileStyles.inputWrap}>
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
      />
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {

  const profileData = ProfileJson();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);


  // Personal info
  const [fullName, setFullName] = useState(profileData.user.fullName);
  const [email, setEmail] = useState(profileData.user.email);
  const [phone, setPhone] = useState(profileData.user.phone);

  // Change password
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const handleUpdatePassword = () => {
    setPwdError('');
    if (!currentPwd) { setPwdError('Please enter your current password.'); return; }
    if (newPwd.length < 8) { setPwdError('New password must be at least 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match.'); return; }
    Alert.alert('Success', 'Password updated successfully.');
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    setPasswordOpen(false);
  };

  // Exam preferences
  const [exams, setExams] = useState(profileData.exams);
  const [selectedExam, setSelectedExam] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [targetPct, setTargetPct] = useState('');
  const [examDropdownOpen, setExamDropdownOpen] = useState(false);

  const examOptions = profileData.examOptions;

  // Notifications
  const [notifs, setNotifs] = useState(profileData.notifications);

  const toggleNotif = (key: NotifKey) =>
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSavePersonal = () => {
    Alert.alert('Saved', 'Personal information updated successfully.');
  };

  const handleAddExam = () => {
    if (!selectedExam || !targetYear) {
      Alert.alert('Required', 'Please select an exam and enter a target year.');
      return;
    }
    setExams((prev) => [
      ...prev,
      { id: Date.now(), name: selectedExam, year: targetYear },
    ]);
    setSelectedExam('');
    setTargetYear('');
    setTargetPct('');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={profileStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        onMenuPress={() => setDrawerOpen(true)}
        onProfilePress={() => setProfileOpen(!profileOpen)}
      />

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
              {profileData.user.initials}
            </Text>
          </View>
          <Text style={profileStyles.heroName}>{profileData.user.fullName}</Text>
          <Text style={profileStyles.heroEmail}>
            <Ionicons name="mail-outline" size={13} color={COLORS.textLight} />{' '}
            {profileData.user.email}
          </Text>
          <View style={profileStyles.heroBadges}>
            <View style={profileStyles.heroBadgeChip}>
              <Text style={profileStyles.heroBadgeText}>{profileData.user.role}</Text>
            </View>
            <View style={profileStyles.heroBadgeChip}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.textLight} />
              <Text style={profileStyles.heroBadgeText}>Member since {profileData.user.memberSince}</Text>
            </View>
          </View>
        </View>

        {/* ── Personal Information ── */}
        <View style={profileStyles.card}>
          <SectionHeader
            title="Personal Information"
            subtitle="Update your name and contact details."
          />
          <LabeledInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Tejasri Bellam"
          />
          <LabeledInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="tejasri@mailinator.com"
            keyboardType="email-address"
          />
          <LabeledInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="9876543210"
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={profileStyles.saveBtn} onPress={handleSavePersonal}>
            <Ionicons name="checkmark" size={16} color={COLORS.white} />
            <Text style={profileStyles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        {/* ── Exam Preferences ── */}
        <View style={profileStyles.card}>
          <SectionHeader
            title="Exam Preferences"
            subtitle="Add your target exams with year and percentage goals."
          />

          {/* Existing exams list */}
          {exams.map((ex) => (
            <View key={ex.id} style={profileStyles.examRow}>
              <View style={profileStyles.examRowInfo}>
                <Text style={profileStyles.examRowName}>{ex.name}</Text>
                <Text style={profileStyles.examRowYear}>Year: {ex.year}</Text>
              </View>
              <Ionicons name="checkmark" size={18} color={COLORS.primary} />
            </View>
          ))}

          {/* Add new exam */}
          <View style={profileStyles.addExamForm}>
            {/* Exam dropdown */}
            <Text style={profileStyles.inputLabel}>Target Exam *</Text>
            <TouchableOpacity
              style={profileStyles.dropdown}
              onPress={() => setExamDropdownOpen(!examDropdownOpen)}
            >
              <Text style={[profileStyles.dropdownText, !selectedExam && { color: COLORS.textLight }]}>
                {selectedExam || 'Select exam'}
              </Text>
              <Ionicons
                name={examDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={COLORS.textLight}
              />
            </TouchableOpacity>

            {examDropdownOpen && (
              <View style={profileStyles.dropdownOptions}>
                {examOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={profileStyles.dropdownOption}
                    onPress={() => {
                      setSelectedExam(opt);
                      setExamDropdownOpen(false);
                    }}
                  >
                    <Text style={profileStyles.dropdownOptionText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[profileStyles.inputLabel, { marginTop: 12 }]}>Target Year *</Text>
            <TextInput
              style={profileStyles.textInput}
              value={targetYear}
              onChangeText={setTargetYear}
              placeholder="e.g. 2026"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
            />

            <Text style={[profileStyles.inputLabel, { marginTop: 12 }]}>Target Percentage</Text>
            <TextInput
              style={profileStyles.textInput}
              value={targetPct}
              onChangeText={setTargetPct}
              placeholder="e.g. 95"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
            />

            <TouchableOpacity style={profileStyles.addExamBtn} onPress={handleAddExam}>
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text style={profileStyles.addExamBtnText}>Add Target Exam</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Account Security ── */}
        <View style={profileStyles.card}>
          <SectionHeader title="Account Security" subtitle="" />

          {/* Change Password accordion row */}
          <TouchableOpacity
            style={profileStyles.securityRow}
            onPress={() => setPasswordOpen(!passwordOpen)}
            activeOpacity={0.7}
          >
            <View style={profileStyles.securityIconWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMedium} />
            </View>
            <View style={profileStyles.securityInfo}>
              <Text style={profileStyles.securityTitle}>Change Password</Text>
              <Text style={profileStyles.securitySub}>Update your login password</Text>
            </View>
            <Ionicons
              name={passwordOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          {/* Expanded password form */}
          {passwordOpen && (
            <View style={profileStyles.pwdForm}>
              {/* Current Password */}
              <Text style={profileStyles.inputLabel}>Current Password</Text>
              <View style={profileStyles.pwdInputRow}>
                <TextInput
                  style={profileStyles.pwdInput}
                  value={currentPwd}
                  onChangeText={setCurrentPwd}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry={!showCurrentPwd}
                />
                <TouchableOpacity
                  style={profileStyles.eyeBtn}
                  onPress={() => setShowCurrentPwd(!showCurrentPwd)}
                >
                  <Ionicons
                    name={showCurrentPwd ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              </View>

              {/* New Password */}
              <Text style={[profileStyles.inputLabel, { marginTop: 12 }]}>New Password</Text>
              <View style={profileStyles.pwdInputRow}>
                <TextInput
                  style={profileStyles.pwdInput}
                  value={newPwd}
                  onChangeText={setNewPwd}
                  placeholder="At least 8 characters"
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry={!showNewPwd}
                />
                <TouchableOpacity
                  style={profileStyles.eyeBtn}
                  onPress={() => setShowNewPwd(!showNewPwd)}
                >
                  <Ionicons
                    name={showNewPwd ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm New Password */}
              <Text style={[profileStyles.inputLabel, { marginTop: 12 }]}>Confirm New Password</Text>
              <View style={profileStyles.pwdInputRow}>
                <TextInput
                  style={profileStyles.pwdInput}
                  value={confirmPwd}
                  onChangeText={setConfirmPwd}
                  placeholder="Repeat new password"
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry={!showConfirmPwd}
                />
                <TouchableOpacity
                  style={profileStyles.eyeBtn}
                  onPress={() => setShowConfirmPwd(!showConfirmPwd)}
                >
                  <Ionicons
                    name={showConfirmPwd ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              </View>

              {/* Error */}
              {pwdError !== '' && (
                <Text style={profileStyles.pwdError}>{pwdError}</Text>
              )}

              {/* Action buttons */}
              <View style={profileStyles.pwdActions}>
                <TouchableOpacity
                  style={profileStyles.updatePwdBtn}
                  onPress={handleUpdatePassword}
                >
                  <Ionicons name="lock-closed" size={14} color={COLORS.white} />
                  <Text style={profileStyles.updatePwdBtnText}>Update{''}Password</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={profileStyles.cancelPwdBtn}
                  onPress={() => {
                    setPasswordOpen(false);
                    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
                    setPwdError('');
                  }}
                >
                  <Text style={profileStyles.cancelPwdBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Notification Preferences ── */}
        <View style={profileStyles.card}>
          <SectionHeader
            title="Notification Preferences"
            subtitle="Choose what updates you'd like to receive."
          />

          {profileData.notificationList.map((item, idx, arr) => (
            <View
              key={item.key}
              style={[
                profileStyles.notifRow,
                idx < arr.length - 1 && profileStyles.notifRowBorder,
              ]}
            >
              <View style={profileStyles.notifInfo}>
                <Text style={profileStyles.notifLabel}>{item.label}</Text>
                <Text style={profileStyles.notifChannel}>{item.channel}</Text>
              </View>

              <Switch
                value={notifs[item.key]}
                onValueChange={() => toggleNotif(item.key)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
                ios_backgroundColor={COLORS.border}
              />
            </View>
          ))}
        </View>

        {/* ── Danger Zone ── */}
        <View style={profileStyles.dangerCard}>
          <View style={profileStyles.dangerHeader}>
            <Ionicons name="warning-outline" size={18} color={COLORS.red} />
            <Text style={profileStyles.dangerTitle}>Danger Zone</Text>
          </View>
          <Text style={profileStyles.dangerDesc}>
            Permanently delete your account and all associated data. This cannot be undone.
          </Text>
          <TouchableOpacity style={profileStyles.deleteBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={15} color={COLORS.red} />
            <Text style={profileStyles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Sidebar
       visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ProfileMenu
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

    </SafeAreaView>
  );
}