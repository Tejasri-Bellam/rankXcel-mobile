import React, { useState, useRef, useEffect } from "react";
import { Animated, Platform, StyleSheet, TouchableOpacity, View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Question } from "../json/practice";
import { COLORS } from "@/src/styles/styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import PracticeProgress from "./PracticeProgress";
import { AnswerState } from "./PracticeExamFlow";


export default function PracticeQuestions({
  questions,
  chapterName,
  timerEnabled,
  onEnd,
}: {
  questions: Question[];
  chapterName: string;
  timerEnabled: boolean;
  onEnd: (answers: AnswerState[], totalSeconds: number) => void;
}) {

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>(
    questions.map(() => ({
      selected: null,
      markedForReview: false,
      answered: false,
      correct: null,
    }))
  );
  const [totalSeconds, setTotalSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (timerEnabled) {
      intervalRef.current = setInterval(() => setTotalSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerEnabled]);

  const current = answers[currentIdx];
  const question = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const handleSelectOption = (optId: string) => {
    if (current.answered) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], selected: optId };
      return next;
    });
  };

  const handleSaveNext = () => {
    if (!current.answered && current.selected) {
      // Grade the answer
      const isCorrect = current.selected === question.correctOption;
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIdx] = {
          ...next[currentIdx],
          answered: true,
          correct: isCorrect,
        };
        return next;
      });
      return; // show result for this question first
    }

    // Already answered – navigate
    if (!isLast) {
      navigateTo(currentIdx + 1);
    } else {
      // End practice
      if (intervalRef.current) clearInterval(intervalRef.current);
      onEnd(answers, totalSeconds);
    }
  };

  const handleNextQuestion = () => {
    if (!isLast) {
      navigateTo(currentIdx + 1);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      onEnd(answers, totalSeconds);
    }
  };

  const navigateTo = (idx: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setCurrentIdx(idx);
  };

  const handleMarkReview = () => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = {
        ...next[currentIdx],
        markedForReview: !next[currentIdx].markedForReview,
      };
      return next;
    });
  };

  const handleClear = () => {
    if (current.answered) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], selected: null };
      return next;
    });
  };

  const handleEndPractice = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onEnd(answers, totalSeconds);
  };

  const optionStyle = (optId: string) => {
    if (!current.answered) {
      return [
        qStyles.optionRow,
        current.selected === optId && qStyles.optionSelected,
      ];
    }
    if (optId === question.correctOption) return [qStyles.optionRow, qStyles.optionCorrect];
    if (optId === current.selected && optId !== question.correctOption)
      return [qStyles.optionRow, qStyles.optionWrong];
    return [qStyles.optionRow, qStyles.optionDimmed];
  };

  const optionTextStyle = (optId: string) => {
    if (!current.answered) {
      return [qStyles.optionText, current.selected === optId && qStyles.optionTextSelected];
    }
    if (optId === question.correctOption) return [qStyles.optionText, qStyles.optionTextCorrect];
    if (optId === current.selected) return [qStyles.optionText, qStyles.optionTextWrong];
    return [qStyles.optionText, qStyles.optionTextDimmed];
  };

  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  const timeLabel = `${mm}:${ss}`;


  const TimerDisplay = ({ running }: { running: boolean }) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <SafeAreaView style={qStyles.safeArea}>
      {/* Header */}
      <View style={qStyles.header}>
        <View style={qStyles.headerLeft}>
          <Text style={qStyles.practiceMode}>Practice Mode</Text>
          <Text style={qStyles.chapterLabel} numberOfLines={1}>
            {chapterName.substring(0, 12)}...
          </Text>
        </View>

        <View style={qStyles.headerCenter}>
          <PracticeProgress
            current={currentIdx}
            total={questions.length}
            answers={answers}
          />
          <Text style={qStyles.progressText}>
            {currentIdx + 1}/{questions.length}
          </Text>
        </View>

        <TouchableOpacity style={qStyles.endBtn} onPress={handleEndPractice}>
          <Text style={qStyles.endBtnText}>End Practice</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={qStyles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={qStyles.scrollContent}
      >
        {/* Meta row */}
        <View style={qStyles.metaRow}>
          <View style={qStyles.qNumBadge}>
            <Text style={qStyles.qNumText}>
              Q {currentIdx + 1} of {questions.length}
            </Text>
          </View>
          <View style={qStyles.typeBadge}>
            <Text style={qStyles.typeText}>Single Correct</Text>
          </View>
          <View style={qStyles.marksBadge}>
            <Text style={qStyles.marksGreen}>+4 marks</Text>
          </View>
          <View style={qStyles.marksBadge}>
            <Text style={qStyles.marksRed}>-1 marks</Text>
          </View>
          {timerEnabled && (
            <TimerDisplay running={!current.answered} />
          )}
        </View>

        {/* Question */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={qStyles.questionText}>{question.text}</Text>

          {/* Options */}
          <View style={qStyles.optionsList}>
            {question.options.map((opt: any) => (
              <TouchableOpacity
                key={opt.id}
                style={optionStyle(opt.id)}
                onPress={() => handleSelectOption(opt.id)}
                activeOpacity={current.answered ? 1 : 0.7}
              >
                <View style={[
                  qStyles.optionBubble,
                  current.selected === opt.id && !current.answered && qStyles.optionBubbleSelected,
                  current.answered && opt.id === question.correctOption && qStyles.optionBubbleCorrect,
                  current.answered && opt.id === current.selected && opt.id !== question.correctOption && qStyles.optionBubbleWrong,
                ]}>
                  <Text style={[
                    qStyles.optionBubbleText,
                    (current.selected === opt.id && !current.answered) || (current.answered && (opt.id === question.correctOption || opt.id === current.selected))
                      ? { color: COLORS.white }
                      : {},
                  ]}>
                    {opt.id}
                  </Text>
                </View>
                <Text style={optionTextStyle(opt.id)}>{opt.text}</Text>
                {current.answered && opt.id === question.correctOption && (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.green} style={{ marginLeft: 'auto' }} />
                )}
                {current.answered && opt.id === current.selected && opt.id !== question.correctOption && (
                  <Ionicons name="close-circle" size={18} color={COLORS.red} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Feedback */}
          {current.answered && (
            <View style={[
              qStyles.feedbackBox,
              current.correct ? qStyles.feedbackCorrect : qStyles.feedbackWrong,
            ]}>
              <View style={qStyles.feedbackHeader}>
                <Ionicons
                  name={current.correct ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={current.correct ? COLORS.green : COLORS.red}
                />
                <Text style={[
                  qStyles.feedbackTitle,
                  { color: current.correct ? COLORS.green : COLORS.red },
                ]}>
                  {current.correct ? 'Correct!' : 'Incorrect'}
                </Text>
              </View>
              {!current.correct && (
                <View style={qStyles.answerRow}>
                  <Text style={qStyles.yourAnswer}>
                    Your answer:{' '}
                    <Text style={{ color: COLORS.red, fontWeight: '700' }}>
                      ({current.selected}) {question.options.find((o: any) => o.id === current.selected)?.text}
                    </Text>
                  </Text>
                  <Text style={qStyles.correctAnswer}>
                    Correct answer:{' '}
                    <Text style={{ color: COLORS.green, fontWeight: '700' }}>
                      ({question.correctOption}) {question.options.find((o: any) => o.id === question.correctOption)?.text}
                    </Text>
                  </Text>
                </View>
              )}
              {/* Explanation */}
              <View style={qStyles.explanationBox}>
                <View style={qStyles.explanationHeader}>
                  <Ionicons name="bulb-outline" size={16} color={COLORS.orange} />
                  <Text style={qStyles.explanationTitle}>Explanation</Text>
                </View>
                <Text style={qStyles.explanationText}>{question.explanation}</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={qStyles.bottomBar}>
        {/* Mark for Review / Clear */}
        <View style={qStyles.bottomActions}>
          <TouchableOpacity
            style={[
              qStyles.reviewBtn,
              current.markedForReview && qStyles.reviewBtnActive,
            ]}
            onPress={handleMarkReview}
          >
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={16}
              color={current.markedForReview ? COLORS.primary : COLORS.textLight}
            />
            <Text style={[
              qStyles.reviewText,
              current.markedForReview && qStyles.reviewTextActive,
            ]}>
              Mark for Review
            </Text>
          </TouchableOpacity>

          {current.answered ? (
            <Text style={qStyles.answeredBadge}>Answered</Text>
          ) : current.selected ? (
            <TouchableOpacity style={qStyles.clearBtn} onPress={handleClear}>
              <Ionicons name="trash-outline" size={14} color={COLORS.red} />
              <Text style={qStyles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <Text style={qStyles.notVisitedText}>Not Visited</Text>
          )}
        </View>

        {/* Navigation */}
        <View style={qStyles.navRow}>
          <TouchableOpacity
            style={[qStyles.navBtn, currentIdx === 0 && qStyles.navBtnDisabled]}
            onPress={() => currentIdx > 0 && navigateTo(currentIdx - 1)}
            disabled={currentIdx === 0}
          >
            <Ionicons name="chevron-back" size={16} color={currentIdx === 0 ? COLORS.border : COLORS.textMedium} />
            <Text style={[qStyles.navBtnText, currentIdx === 0 && { color: COLORS.border }]}>Prev</Text>
          </TouchableOpacity>

          {current.answered ? (
            <TouchableOpacity style={qStyles.nextQuestionBtn} onPress={handleNextQuestion}>
              <Text style={qStyles.nextQuestionText}>
                {isLast ? 'Finish' : 'Next Question'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[qStyles.saveNextBtn, !current.selected && qStyles.saveNextBtnDisabled]}
              onPress={handleSaveNext}
              disabled={!current.selected}
            >
              <MaterialCommunityIcons name="content-save-outline" size={16} color={COLORS.white} />
              <Text style={qStyles.saveNextText}>
                {isLast && current.answered ? 'Finish' : 'Save & Next'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[qStyles.navBtn, isLast && qStyles.navBtnDisabled]}
            onPress={() => !isLast && navigateTo(currentIdx + 1)}
            disabled={isLast}
          >
            <Text style={[qStyles.navBtnText, isLast && { color: COLORS.border }]}>Next</Text>
            <Ionicons name="chevron-forward" size={16} color={isLast ? COLORS.border : COLORS.textMedium} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
}


const qStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  headerLeft: { minWidth: 70 },
  practiceMode: { fontSize: 10, color: COLORS.textLight, fontWeight: '600', letterSpacing: 0.5 },
  chapterLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  headerCenter: { flex: 1, gap: 4 },
  progressText: { fontSize: 11, color: COLORS.textLight, textAlign: 'center' },
  endBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.red,
  },
  endBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.white },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  qNumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qNumText: { fontSize: 12, fontWeight: '600', color: COLORS.textMedium },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  typeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  marksBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  marksGreen: { fontSize: 12, fontWeight: '700', color: COLORS.green },
  marksRed: { fontSize: 12, fontWeight: '700', color: COLORS.red },

  // Question
  questionText: {
    fontSize: 15,
    color: COLORS.textDark,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 20,
  },

  // Options
  optionsList: { gap: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionCorrect: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenLight,
  },
  optionWrong: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.redLight,
  },
  optionDimmed: {
    opacity: 0.5,
  },
  optionBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  optionBubbleSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionBubbleCorrect: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  optionBubbleWrong: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  },
  optionBubbleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMedium,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  optionTextSelected: { color: COLORS.primary, fontWeight: '600' },
  optionTextCorrect: { color: COLORS.green, fontWeight: '600' },
  optionTextWrong: { color: COLORS.red, fontWeight: '600' },
  optionTextDimmed: { color: COLORS.textLight },

  // Feedback
  feedbackBox: {
    marginTop: 20,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
  },
  feedbackCorrect: {
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.green,
  },
  feedbackWrong: {
    backgroundColor: COLORS.redLight,
    borderColor: COLORS.red,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  answerRow: { gap: 4, marginBottom: 12 },
  yourAnswer: { fontSize: 13, color: COLORS.textMedium },
  correctAnswer: { fontSize: 13, color: COLORS.textMedium },
  explanationBox: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.orange,
  },
  explanationText: {
    fontSize: 13,
    color: COLORS.textMedium,
    lineHeight: 20,
  },

  // Bottom bar
  bottomBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 14,
    gap: 10,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  reviewBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  reviewText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  reviewTextActive: { color: COLORS.primary },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.redLight,
    backgroundColor: COLORS.redLight,
  },
  clearText: { fontSize: 13, fontWeight: '600', color: COLORS.red },
  answeredBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.green,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.greenLight,
    borderRadius: 8,
  },
  notVisitedText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMedium },
  saveNextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveNextBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  saveNextText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  nextQuestionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 12,
  },
  nextQuestionText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
