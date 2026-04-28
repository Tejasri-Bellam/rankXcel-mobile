import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '@/src/styles/styles';
import { Difficulty } from '../json/practice';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { QuestionSlider } from './PracticeExamFlow';


export default function PracticeSettingsModal({
  chapterName,
  accuracy,
  onBegin,
  onCancel,
}: {
  chapterName: string;
  accuracy: number | null;
  onBegin: (questions: number, difficulty: Difficulty, timer: boolean) => void;
  onCancel: () => void;
}) {
  const [questionCount, setQuestionCount] = useState(20);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [timerEnabled, setTimerEnabled] = useState(false);

  const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

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
              key={d}
              style={[
                settingsStyles.diffBtn,
                difficulty === d && settingsStyles.diffBtnActive,
              ]}
              onPress={() => setDifficulty(d)}
            >
              <Text
                style={[
                  settingsStyles.diffText,
                  difficulty === d && settingsStyles.diffTextActive,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={settingsStyles.divider} />

        {/* Timer */}
        <TouchableOpacity
          style={settingsStyles.timerRow}
          onPress={() => setTimerEnabled(!timerEnabled)}
          activeOpacity={0.8}
        >
          <View
            style={[
              settingsStyles.checkbox,
              timerEnabled && settingsStyles.checkboxChecked,
            ]}
          >
            {timerEnabled && (
              <Ionicons name="checkmark" size={12} color={COLORS.white} />
            )}
          </View>
          <View>
            <Text style={settingsStyles.timerLabel}>Enable Timer</Text>
            <Text style={settingsStyles.timerSub}>Track time spent on this session</Text>
          </View>
        </TouchableOpacity>

        <View style={settingsStyles.divider} />

        {/* Actions */}
        <View style={settingsStyles.actions}>
          <TouchableOpacity style={settingsStyles.cancelBtn} onPress={onCancel}>
            <Text style={settingsStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={settingsStyles.beginBtn}
            onPress={() => onBegin(questionCount, difficulty, timerEnabled)}
          >
            <Ionicons name="play-circle-outline" size={18} color={COLORS.white} />
            <Text style={settingsStyles.beginText}>Begin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const settingsStyles: any =({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  accuracy: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  diffBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  diffTextActive: {
    color: COLORS.white,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  timerSub: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  beginBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});