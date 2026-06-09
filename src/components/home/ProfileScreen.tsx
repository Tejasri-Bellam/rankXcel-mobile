import { logoutService } from '@/src/libs/services/auth';
import {
  addTargetExamService,
  deleteAccountService,
  deleteTargetExamService,
  getExamsListService,
  getMeService,
  getMyTargetExamsService,
  getNotificationsService,
  getTargetExamsService,
  updateMeService,
  updateNotificationsService,
} from '@/src/libs/services/profile';
import { profileStyles } from '@/src/styles/sidebar/profileStyles';
import { COLORS } from '@/src/styles/styles';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { storageSetAccessToken } from '@/src/libs/storage';
import { useTargetExam } from '@/src/libs/context/TagretExamContext';

const { width } = Dimensions.get('window');

// Types
// `id` is the exam id (used to dedupe the dropdown); `recordId` is the
// target-exam preference id needed to DELETE it.
type ExamEntry = {
  id: number;
  name: string;
  year: string;
  percentage?: string;
  recordId?: number | string;
};
type NotifKey = 'mockResults' | 'weeklyTips' | 'mockNotif' | 'practiceReminders' | 'productUpdates';

const NOTIFICATION_ITEMS: { key: NotifKey; label: string; channel: string }[] = [
  { key: 'mockResults', label: 'Mock results and analysis ready', channel: 'Email' },
  { key: 'weeklyTips', label: 'Weekly study tips and performance insights', channel: 'Email' },
  { key: 'mockNotif', label: 'Mock results notification', channel: 'In-App' },
  { key: 'practiceReminders', label: 'Practice reminders and streaks', channel: 'In-App' },
  { key: 'productUpdates', label: 'Product updates and announcements', channel: 'In-App' },
];

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
  const { refreshExams } = useTargetExam();

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  // Exam preferences
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | ''>('');
  const [selectedExamName, setSelectedExamName] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [targetPercentage, setTargetPercentage] = useState('');
  const [examDropdownOpen, setExamDropdownOpen] = useState(false);
  const [examOptions, setExamOptions] = useState<{ id: number; name: string }[]>([]);

  // Notifications
  const [notifs, setNotifs] = useState<any>({});

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

  // Fetch the user's assigned exams (GET /v1/exams/my-target-exams/).
  // We also pull /v1/exams/target-exams/ to map each exam -> its preference
  // record id, which is what the DELETE endpoint expects.
  const fetchPreferences = async () => {
  try {
    const [myRes, prefRes] = await Promise.all([
      getMyTargetExamsService(),
      getTargetExamsService().catch(() => null),
    ]);

    // exam id -> target-exam record id
    const recordMap = new Map<number | string, number | string>();
    const prefRaw: any = prefRes?.data;
    const prefList: any[] = Array.isArray(prefRaw)
      ? prefRaw
      : prefRaw?.results || [];
    prefList.forEach((item: any) => {
      const examId = item.exam?.id ?? item.exam_id;
      const recordId = item.id ?? item.target_exam_id;
      if (examId != null && recordId != null) recordMap.set(examId, recordId);
    });

    if (myRes.status === 200) {
      const raw: any = myRes.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
      // my-target-exams returns exam objects directly ({ id, name, code, ... });
      // still tolerate the older { exam: {...}, target_year } shape.
      const mappedExams = list.map((item: any) => {
        const examId = item.exam?.id ?? item.id ?? item.exam_id;
        return {
          id: examId,
          name: item.exam?.name ?? item.name ?? item.exam_name,
          year: String(item.target_year ?? item.year ?? ''),
          // Prefer an explicit record id; fall back to the mapped one, then
          // the exam id so delete still has something to send.
          recordId:
            item.target_exam_id ?? recordMap.get(examId) ?? examId,
        };
      });

      setExams(mappedExams);
    }
  } catch (error) {
    console.log("My target exams error:", error);
  }
};

  // Fetch list of available exams for dropdown
  const fetchExamsList = async () => {
    try {
      const res = await getExamsListService();
      if (res.status === 200) {
        const raw: any = res.data;
        const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
        setExamOptions(
          list.map((item: any) => ({ id: item.id, name: item.name }))
        );
      }
    } catch (error) {
      console.log('Exams list error:', error);
    }
  };

  //  Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsService();
      if (res?.status === 200) {
        const data: any = res?.data || {};
        setNotifs({
          mockResults: !!data.mockResults,
          weeklyTips: !!data.weeklyTips,
          mockNotif: !!data.mockNotif,
          practiceReminders: !!data.practiceReminders,
          productUpdates: !!data.productUpdates,
        });
      }
    } catch (error) {
      console.log('Notifications Error:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchExamsList();
    fetchNotifications();
  }, []);

  // Re-pull the assigned-exam list every time the screen regains focus so a
  // newly assigned exam (e.g. via the Set Goal flow) shows up without a reload.
  useFocusEffect(
    useCallback(() => {
      fetchPreferences();
    }, [])
  );

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

  
  const handleUpdatePassword = async () => {
    setPwdError('');
    if (!currentPwd) { setPwdError('Please enter your current password.'); return; }
    if (newPwd.length < 8) { setPwdError('New password must be at least 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match.'); return; }

    try {
      setPwdLoading(true);
      Alert.alert(
        'Not Available',
        'Authenticated password change endpoint is not yet available. Please use "Forgot Password" from the login screen to reset your password.'
      );
    } finally {
      setPwdLoading(false);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setPasswordOpen(false);
    }
  };


  // Exam preferences
  const handleAddExam = async () => {
  if (!selectedExamId || !targetYear) {
    Alert.alert(
      "Required",
      "Please select an exam and enter a target year."
    );
    return;
  }

  if (exams.some((ex) => ex.id === selectedExamId)) {
    Alert.alert(
      "Already added",
      `${selectedExamName} is already in your target exams.`
    );
    return;
  }

  try {
    const payload: {
      exam: number | string;
      target_year: number;
      target_percentage?: number;
    } = {
      exam: selectedExamId,
      target_year: Number(targetYear),
      ...(targetPercentage ? { target_percentage: Number(targetPercentage) } : {}),
    };
    console.log('payload', payload);

    const res = await addTargetExamService(payload);
    console.log('res', res);

      if (res.status === 200 || res.status === 201) {
        Alert.alert("Success", "Target exam added");

        setSelectedExamId('');
        setSelectedExamName('');
        setTargetYear("");
        setTargetPercentage('');

        fetchPreferences();
        // Keep the sidebar "Your courses" / dashboard list in sync.
        refreshExams();
      }
    } catch (error: any) {
      console.log(
        "Add target exam error — status:",
        error?.status,
        "errors:",
        JSON.stringify(error?.errors),
        "body:",
        JSON.stringify(error?.body)
      );
      const apiErrors = error?.errors || {};
      const body = error?.body || {};
      const firstMessage =
        apiErrors.nonFieldErrors?.[0] ||
        apiErrors.exam?.[0] ||
        apiErrors.target_year?.[0] ||
        Object.values(apiErrors).flat()[0] ||
        (typeof body.detail === "string" ? body.detail : null) ||
        JSON.stringify(body) ||
        "Failed to add target exam";
      Alert.alert("Error", String(firstMessage));
    }
  };

  // Remove an assigned target exam (DELETE /v1/exams/target-exams/{id}/)
  const handleDeleteExam = (exam: ExamEntry) => {
    const deleteId = exam.recordId ?? exam.id;
    Alert.alert(
      "Remove exam",
      `Remove ${exam.name} from your target exams?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            // Optimistically drop it; restore on failure.
            const prev = exams;
            setExams((list) => list.filter((e) => e.id !== exam.id));
            try {
              await deleteTargetExamService(deleteId);
              // Keep the sidebar "Your courses" / dashboard list in sync.
              refreshExams();
            } catch (error: any) {
              setExams(prev);
              const body = error?.body || {};
              const message =
                Object.values(error?.errors || {}).flat()[0] ||
                (typeof body.detail === "string" ? body.detail : null) ||
                "Failed to remove target exam";
              Alert.alert("Error", String(message));
            }
          },
        },
      ]
    );
  };

  //  Notifications
  const toggleNotif = async (key: NotifKey) => {
  const prev = notifs;
  const next = { ...notifs, [key]: !notifs[key] };

      setNotifs(next);

      try {
        await updateNotificationsService({
          [key]: next[key],
        });

        Alert.alert('Success', 'Notification preference updated');
      } catch {
        setNotifs(prev);
        Alert.alert('Un-success', 'Failed to update notification preference');
      }
    };

  // Delete account 
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccountService();

              await storageSetAccessToken('');

              Alert.alert('Success', 'Account Deleted Successfully');
              router.replace('/auth/login');
            } catch {
              Alert.alert('Un-success', 'Failed to Delete Account');
            }
          },
        },
      ]
    );
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
        onPress={() => router.back()}
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
          {name ? <Text style={profileStyles.heroName}>{name}</Text> : null}
          {email ? <Text style={profileStyles.heroEmail}>{email}</Text> : null}
          {user?.role ? (
            <View style={profileStyles.heroBadges}>
              <View style={profileStyles.heroBadgeChip}>
                <Text style={profileStyles.heroBadgeText}>{user.role}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ── Personal Information ── */}
        <View style={profileStyles.card}>
          <SectionHeader title="Personal Information" subtitle="Update your name and contact details." />
          <LabeledInput label="Full Name" value={name} onChangeText={setname} placeholder="Your full name" />
          <LabeledInput label="Email Address" value={email} onChangeText={setEmail} placeholder="you@gmail.com" keyboardType="email-address" disabled={true} />
          <LabeledInput label="Phone Number" value={phone} onChangeText={setPhone} placeholder="9876543210" keyboardType="phone-pad" />
          <TouchableOpacity style={profileStyles.saveBtn} onPress={handleSavePersonal} disabled={saveLoading}>
            {saveLoading
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Ionicons name="checkmark" size={16} color={COLORS.white} />
            }
            <Text style={profileStyles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        {/* ── Exam Preferences ── */}
        <View style={profileStyles.card}>
          <SectionHeader title="Exam Preferences" subtitle="Add your target exams with year and percentage goals." />

          {exams.map((ex) => (
            <View key={ex.id} style={profileStyles.examRow}>
              <View style={profileStyles.examRowInfo}>
                <Text style={profileStyles.examRowName}>{ex.name}</Text>
                {ex.year ? (
                  <Text style={profileStyles.examRowYear}>Year: {ex.year}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={profileStyles.examRowDelete}
                onPress={() => handleDeleteExam(ex)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={profileStyles.addExamForm}>
            <Text style={profileStyles.inputLabel}>Target Exam *</Text>
            <TouchableOpacity style={profileStyles.dropdown} onPress={() => setExamDropdownOpen(!examDropdownOpen)}>
              <Text style={[profileStyles.dropdownText, !selectedExamName && { color: COLORS.textLight }]}>
                {selectedExamName || 'Select exam'}
              </Text>
              <Ionicons name={examDropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textLight} />
            </TouchableOpacity>

            {examDropdownOpen && (
              <View style={profileStyles.dropdownOptions}>
                {examOptions.length === 0 ? (
                  <View style={profileStyles.dropdownOption}>
                    <Text style={[profileStyles.dropdownOptionText, { color: COLORS.textLight }]}>No exams available</Text>
                  </View>
                ) : (
                  examOptions.map((opt) => {
                    const assigned = exams.some((ex) => ex.id === opt.id);
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          profileStyles.dropdownOption,
                          assigned && { opacity: 0.45 },
                        ]}
                        disabled={assigned}
                        onPress={() => {
                          setSelectedExamId(opt.id);
                          setSelectedExamName(opt.name);
                          setExamDropdownOpen(false);
                        }}
                      >
                        <Text style={profileStyles.dropdownOptionText}>
                          {opt.name}
                        </Text>
                        {assigned ? (
                          <Text style={profileStyles.dropdownOptionAssigned}>
                            Assigned
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            <Text style={[profileStyles.inputLabel, { marginTop: 12 }]}>Target Year *</Text>
            <TextInput style={profileStyles.textInput} value={targetYear} onChangeText={setTargetYear} placeholder="e.g. 2026" placeholderTextColor={COLORS.textLight} keyboardType="numeric" />
            <Text style={[profileStyles.inputLabel, { marginTop: 12 }]}>Target Percentage</Text>
            <TextInput
              style={profileStyles.textInput}
              value={targetPercentage}
              onChangeText={setTargetPercentage}
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

          <TouchableOpacity style={profileStyles.securityRow} onPress={() => setPasswordOpen(!passwordOpen)} activeOpacity={0.7}>
            <View style={profileStyles.securityIconWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMedium} />
            </View>
            <View style={profileStyles.securityInfo}>
              <Text style={profileStyles.securityTitle}>Change Password</Text>
              <Text style={profileStyles.securitySub}>Update your login password</Text>
            </View>
            <Ionicons name={passwordOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          {passwordOpen && (
            <View style={profileStyles.pwdForm}>
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
                <TouchableOpacity style={profileStyles.updatePwdBtn} onPress={handleUpdatePassword} disabled={pwdLoading}>
                  {pwdLoading
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Ionicons name="lock-closed" size={14} color={COLORS.white} />
                  }
                  <Text style={profileStyles.updatePwdBtnText}>Update Password</Text>
                </TouchableOpacity>
                <TouchableOpacity style={profileStyles.cancelPwdBtn} onPress={() => { setPasswordOpen(false); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); setPwdError(''); }}>
                  <Text style={profileStyles.cancelPwdBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Notification Preferences ── */}
        <View style={profileStyles.card}>
          <SectionHeader title="Notification Preferences" subtitle="Choose what updates you'd like to receive." />
          {NOTIFICATION_ITEMS.map((item, idx, arr) => (
            <View key={item.key} style={[profileStyles.notifRow, idx < arr.length - 1 && profileStyles.notifRowBorder]}>
              <View style={profileStyles.notifInfo}>
                <Text style={profileStyles.notifLabel}>{item.label}</Text>
                <Text style={profileStyles.notifChannel}>{item.channel}</Text>
              </View>
              <Switch
                value={!!notifs[item.key]}
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

    </View>
  );
}
 