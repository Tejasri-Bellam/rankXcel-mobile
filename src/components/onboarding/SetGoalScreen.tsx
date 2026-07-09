import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  addTargetExamService,
  getExamsListService,
  getMyTargetExamsService,
} from '@/src/libs/services/profile';
import { onboardingStyles as s } from '@/src/styles/styles/onboarding/setgoalscreenstyles';
import { COLORS } from '@/src/styles/styles';
import { useTargetExam } from '@/src/libs/context/TagretExamContext';
import { OnboardingJson } from '../json/onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ExamOption = { id: number; name: string };

export default function SetGoalScreen() {
  const data = OnboardingJson();
  const { refreshExams } = useTargetExam();

  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamOption | null>(null);
  const [examDropdownOpen, setExamDropdownOpen] = useState(false);
  const [examSearch, setExamSearch] = useState('');
  const [loadingExams, setLoadingExams] = useState(true);
  const [targetYear, setTargetYear] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Ids of exams the user has already assigned — disabled in the dropdown.
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        // Scope the exam list to the country selected in the profile sidebar
        // (persisted as regionCountryId) → GET /v1/exams/?country={id}.
        const countryId = await AsyncStorage.getItem('regionCountryId');
        const [examsRes, assignedRes] = await Promise.all([
          getExamsListService(countryId),
          getMyTargetExamsService().catch(() => null),
        ]);

        const raw: any = examsRes?.data;
        const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
        setExams(list.map((it: any) => ({ id: it.id, name: it.name })));

        const assignedRaw: any = assignedRes?.data;
        const assignedList: any[] = Array.isArray(assignedRaw)
          ? assignedRaw
          : assignedRaw?.results || [];
        setAssignedIds(
          new Set(
            assignedList
              .map((it: any) => it.exam?.id ?? it.id ?? it.exam_id)
              .filter((id: any) => id != null)
          )
        );
      } catch (err) {
        console.log('Failed to load exams', err);
      } finally {
        setLoadingExams(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!selectedExam || !targetYear) {
      Alert.alert('Required', 'Please select an exam and target year.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await addTargetExamService({
        exam: selectedExam.id,
        target_year: targetYear,
      });
      if (res.status === 200 || res.status === 201) {
        // Refresh the shared target-exam list so the new exam is immediately
        // available in the sidebar "Your courses" and on the dashboard.
        await refreshExams();
        router.replace('/dashboard');
        return;
      }
      Alert.alert('Error', 'Could not save your goal. Please try again.');
    } catch (error: any) {
      const apiErrors = error?.errors || {};
      const body = error?.body || {};
      const message =
        apiErrors.nonFieldErrors?.[0] ||
        apiErrors.exam?.[0] ||
        apiErrors.target_year?.[0] ||
        Object.values(apiErrors).flat()[0] ||
        (typeof body.detail === 'string' ? body.detail : null) ||
        'Failed to save target exam';

      // Goal already set for this account — just continue in.
      if (
        String(message).toLowerCase().includes('already') ||
        error?.status === 409
      ) {
        router.replace('/dashboard');
        return;
      }
      Alert.alert('Error', String(message));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(selectedExam && targetYear) && !submitting;

  const query = examSearch.trim().toLowerCase();
  const filteredExams = query
    ? exams.filter((opt) => opt.name.toLowerCase().includes(query))
    : exams;

  return (
    <View style={s.safeArea}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.logoRow}>
            <View style={s.logoBadge}>
              <Text style={s.logoBadgeText}>{data.logo.shortName}</Text>
            </View>
            <Text style={s.logoText}>{data.logo.name}</Text>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.title}>{data.goal.title}</Text>
          <Text style={s.subtitle}>{data.goal.subtitle}</Text>

          {/* Target exam */}
          <View style={s.inputGroup}>
            <Text style={s.label}>{data.goal.labels.exam}</Text>

            <TouchableOpacity
              style={s.dropdown}
              onPress={() => setExamDropdownOpen((v) => !v)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="search-outline"
                size={16}
                color={COLORS.textLight}
                style={{ marginRight: 10 }}
              />
              {examDropdownOpen ? (
                <TextInput
                  style={s.dropdownInput}
                  value={examSearch}
                  onChangeText={setExamSearch}
                  placeholder={String(data.goal.placeholders.exam)}
                  placeholderTextColor={COLORS.textLight}
                  autoFocus
                />
              ) : (
                <Text
                  style={[
                    s.dropdownText,
                    !selectedExam && s.dropdownPlaceholder,
                  ]}
                >
                  {selectedExam?.name || data.goal.placeholders.exam}
                </Text>
              )}
              <Ionicons
                name={examDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={COLORS.textLight}
              />
            </TouchableOpacity>

            {examDropdownOpen && (
              <View style={s.optionsList}>
                {loadingExams ? (
                  <View style={s.optionEmpty}>
                    <ActivityIndicator color={COLORS.primary} />
                  </View>
                ) : filteredExams.length === 0 ? (
                  <View style={s.optionEmpty}>
                    <Text style={s.optionEmptyText}>
                      {exams.length === 0
                        ? 'No exams available'
                        : 'No matching exams'}
                    </Text>
                  </View>
                ) : (
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {filteredExams.map((opt) => {
                      const assigned = assignedIds.has(opt.id);
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[s.optionRow, assigned && { opacity: 0.45 }]}
                          disabled={assigned}
                          onPress={() => {
                            setSelectedExam(opt);
                            setExamDropdownOpen(false);
                            setExamSearch('');
                          }}
                        >
                          <Text style={s.optionText}>{opt.name}</Text>
                          {assigned ? (
                            <Text style={s.assignedTag}>Assigned</Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Target year */}
          <View style={s.inputGroup}>
            <Text style={s.label}>{data.goal.labels.year}</Text>

            <View style={s.dropdown}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={COLORS.textLight}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={s.dropdownText}
                value={targetYear ? String(targetYear) : ''}
                onChangeText={(text) => {
                  const digits = text.replace(/[^0-9]/g, '');
                  setTargetYear(digits ? Number(digits) : null);
                }}
                placeholder={String(data.goal.placeholders.year)}
                placeholderTextColor={COLORS.textLight}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.primaryBtn, !canSubmit && s.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={s.primaryBtnText}>{data.goal.submitBtn}</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};