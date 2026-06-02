import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '@/src/styles/styles';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Difficulty, QuestionSlider } from './PracticeExamFlow';
import { settingsStyles } from '@/src/styles/sidebar/practice/settings';

interface Props {
  chapterName: string;
  accuracy: number | null;
  loading?: boolean;
  errorText?: string | null;
  initialQuestionCount?: number;
  initialTimerMinutes?: number;
  onBegin: (questions: number, difficulty: Difficulty, timerMinutes: number) => void;
  onCancel: () => void;
}

export default function PracticeSettingsModal({
  chapterName,
  accuracy,
  loading = false,
  errorText,
  initialQuestionCount,
  initialTimerMinutes,
  onBegin,
  onCancel,
}: Props) {
  const [questionCount, setQuestionCount] = useState(initialQuestionCount ?? 20);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [timerText, setTimerText] = useState<string>(
    initialTimerMinutes && initialTimerMinutes > 0 ? String(initialTimerMinutes) : '',
  );

  const difficulties: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  const handleBegin = () => {
    const minutes = Number(timerText);
    onBegin(questionCount, difficulty, Number.isFinite(minutes) ? minutes : 0);
  };

  return (
    <View style={settingsStyles.overlay}>
      <View style={settingsStyles.card}>
        {/* Title */}
        <Text style={settingsStyles.title}>Practice: {chapterName}</Text>
        {accuracy !== null && (
          <Text style={settingsStyles.accuracy}>{accuracy}% accuracy</Text>
        )}

        <View style={settingsStyles.divider} />

        {/* Question count */}
        <View style={settingsStyles.row}>
          <Text style={settingsStyles.label}>Questions</Text>
          <Text style={settingsStyles.valueText}>{questionCount}</Text>
        </View>
        <QuestionSlider value={questionCount} onChange={setQuestionCount} />

        <View style={settingsStyles.divider} />

        {/* Difficulty */}
        <Text style={settingsStyles.label}>Difficulty</Text>
        <View style={settingsStyles.diffRow}>
          {difficulties.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[
                settingsStyles.diffBtn,
                difficulty === d.value && settingsStyles.diffBtnActive,
              ]}
              onPress={() => setDifficulty(d.value)}
            >
              <Text
                style={[
                  settingsStyles.diffText,
                  difficulty === d.value && settingsStyles.diffTextActive,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={settingsStyles.divider} />

        {/* Timer Duration */}
        <View style={settingsStyles.timerHeader}>
          <Ionicons name="time-outline" size={16} color={COLORS.textMedium} />
          <Text style={settingsStyles.timerHeaderText}>
            Timer Duration (minutes)
          </Text>
          <Text style={settingsStyles.timerOptional}> — optional</Text>
        </View>
        <TextInput
          style={settingsStyles.timerInput}
          placeholder="e.g. 30 — leave empty for no timer"
          placeholderTextColor={COLORS.textLight}
          keyboardType="number-pad"
          value={timerText}
          onChangeText={(t) => setTimerText(t.replace(/[^0-9]/g, ''))}
        />

        {errorText ? (
          <Text style={settingsStyles.errorText}>{errorText}</Text>
        ) : null}

        <View style={settingsStyles.divider} />

        {/* Actions */}
        <View style={settingsStyles.actions}>
          <TouchableOpacity
            style={settingsStyles.cancelBtn}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={settingsStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[settingsStyles.beginBtn, loading && { opacity: 0.6 }]}
            onPress={handleBegin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="play-circle-outline" size={18} color={COLORS.white} />
                <Text style={settingsStyles.beginText}>Begin</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

