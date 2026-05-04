import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { examScreenStyles as styles } from '../../styles/sidebar/assessments/exam';
import { assessmentExam } from '../json/assessmentExam';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  onBackToAssessments: () => void;
};

export default function ExamNavigator({ onBackToAssessments }: Props) {
  const data = assessmentExam();

  const examData = data?.[0]?.exam;

  const sections = examData?.sections ?? [];

  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const currentSection = sections[sectionIndex];
  const questions = currentSection?.questions ?? [];
  const currentQuestion = questions[questionIndex];

  if (!examData || sections.length === 0 || !currentQuestion) {
    return (
      <View style={styles.safeArea}>
        <Text style={{ padding: 20 }}>No Exam Data Available</Text>
      </View>
    );
  }

  const globalIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < sectionIndex; i++) {
      count += sections[i]?.questions?.length || 0;
    }
    return count + questionIndex + 1;
  }, [sectionIndex, questionIndex, sections]);

  const handleOptionSelect = (optionId: string) => {
    const qid = currentQuestion.id;
    const isMulti = currentQuestion.type === 'Multi Correct';

    setAnswers((prev) => {
      const prevAns = prev[qid] || [];

      if (isMulti) {
        if (prevAns.includes(optionId)) {
          return {
            ...prev,
            [qid]: prevAns.filter((o) => o !== optionId),
          };
        } else {
          return {
            ...prev,
            [qid]: [...prevAns, optionId],
          };
        }
      } else {
        return {
          ...prev,
          [qid]: [optionId],
        };
      }
    });
  };

  const goNext = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else if (sectionIndex < sections.length - 1) {
      setSectionIndex((prev) => prev + 1);
      setQuestionIndex(0);
    }
  };

  const goPrev = () => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    } else if (sectionIndex > 0) {
      const prevSection = sections[sectionIndex - 1];
      setSectionIndex((prev) => prev - 1);
      setQuestionIndex((prevSection?.questions?.length || 1) - 1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.examLabel}>Exam</Text>
          <Text style={styles.examName}>{examData.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.submitTopBtn}
          onPress={onBackToAssessments}
        >
          <Text style={styles.submitTopBtnText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* SECTION TABS */}
      <View style={styles.sectionTabsRow}>
        {sections.map((sec, idx) => {
          const active = idx === sectionIndex;
          return (
            <TouchableOpacity
              key={sec.id}
              style={[
                styles.sectionTab,
                active && styles.sectionTabActive,
              ]}
              onPress={() => {
                setSectionIndex(idx);
                setQuestionIndex(0);
              }}
            >
              <Text
                style={[
                  styles.sectionTabText,
                  active && styles.sectionTabTextActive,
                ]}
              >
                {sec.name}
              </Text>
              <Text
                style={[
                  styles.sectionTabCount,
                  active && styles.sectionTabCountActive,
                ]}
              >
                {sec.total_questions} Q
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* QUESTION AREA */}
      <ScrollView
        style={styles.questionScroll}
        contentContainerStyle={styles.questionScrollContent}
      >
        <View style={styles.qMetaRow}>
          <Text style={styles.qNumber}>
            Question {globalIndex}
          </Text>

          <View style={styles.qTypeBadge}>
            <Text style={styles.qTypeText}>
              {currentQuestion.type}
            </Text>
          </View>

          <View style={styles.marksBadges}>
            <View style={styles.correctMarkBadge}>
              <Text style={styles.marksBadgeText}>
                +{currentQuestion.marks_correct}
              </Text>
            </View>
            <View style={styles.wrongMarkBadge}>
              <Text style={styles.marksBadgeText}>
                {currentQuestion.marks_incorrect}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.questionText}>
          {currentQuestion.text}
        </Text>

        <Text style={styles.selectLabel}>
          {currentQuestion.type === 'Multi Correct'
            ? 'Select one or more options'
            : 'Select one option'}
        </Text>

        {currentQuestion.options.map((opt) => {
          const selected =
            answers[currentQuestion.id]?.includes(opt.id);

          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.optionRow,
                selected && styles.optionRowSelected,
              ]}
              onPress={() => handleOptionSelect(opt.id)}
            >
              <View
                style={[
                  styles.optionBubble,
                  selected && styles.optionBubbleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionBubbleText,
                    selected && styles.optionBubbleTextSelected,
                  ]}
                >
                  {opt.id}
                </Text>
              </View>

              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {opt.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* NAVIGATION */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={goPrev}>
          <Text style={styles.navBtnText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveNextBtn} onPress={goNext}>
          <Text style={styles.saveNextBtnText}>Save & Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}