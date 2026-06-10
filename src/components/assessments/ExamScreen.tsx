import {
  assessmentSubmitService,
  updateAssessmentResponsesService,
} from "@/src/libs/services/assessments-attempts";
import { stripHtml } from "@/src/libs/utils/html";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getassessmentsQuestionsService } from "../../libs/services/assessments";
import { examScreenStyles as styles } from "../../styles/sidebar/assessments/examScreen";

interface Props {
  assessmentId: number;
  attemptId: number;
  durationMinutes: number;
  onSubmit: (
    answers: Record<string, string[]>,
    timeTakenSeconds: number,
  ) => void;
  onBackToAssessments?: () => void;
}

type QuestionStatus = "not_visited" | "not_answered" | "answered" | "marked";

// The backend question_type enum (QuestionTypeEnum) is one of:
//   MCQ_SINGLE | MCQ_MULTIPLE | NUMERICAL | ASSERTION_REASON
// The helpers below normalise loosely so legacy/alternate strings still resolve.

// Multi-select MCQ — render checkboxes, allow more than one option.
const isMultiSelectType = (type: string | undefined) => {
  if (!type) return false;
  const t = type.toUpperCase();
  return (
    t === "MCQ_MULTIPLE" ||
    t === "MULTI_CORRECT" ||
    t === "MULTI CORRECT" ||
    t === "MULTIPLE" ||
    t.includes("MULTI")
  );
};

// Numerical — render a free-text numeric input instead of options.
const isNumericalType = (type: string | undefined) => {
  if (!type) return false;
  return type.toUpperCase().includes("NUMERIC");
};

// Assertion-Reason — render the Assertion (A) and Reason (R) statements
// above a standard single-select option list.
const isAssertionReasonType = (type: string | undefined) => {
  if (!type) return false;
  return type.toUpperCase().includes("ASSERTION");
};

export default function ExamScreen({
  assessmentId,
  attemptId,
  durationMinutes,
  onSubmit,
  onBackToAssessments,
}: Props) {
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Timer state — initialised after exam data loads
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0);

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [qStatuses, setQStatuses] = useState<Record<string, QuestionStatus>>(
    {},
  );

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const tabWarningTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track in-flight save requests so we can await them before submit
  const pendingSaves = useRef<Set<Promise<any>>>(new Set());

  // ── Load questions ──
  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await getassessmentsQuestionsService(assessmentId);
      console.log("QUESTIONS RESPONSE:", res);
      console.log("QUESTIONS API:", JSON.stringify(res?.data, null, 2));

      const raw: any = res?.data;
      console.log("RAW QUESTIONS:", JSON.stringify(raw, null, 2));

      let examData: any = null;

      if (raw?.sections) {
        examData = raw;
      } else if (raw?.questions) {
        const groupedQuestions = raw.questions.reduce((acc: any, q: any) => {
          const subject = q.subject || q.subject_name || "General";

          if (!acc[subject]) {
            acc[subject] = [];
          }

          acc[subject].push({
            id: q.id,
            text: q.question_text,
            image: q.image,
            type: q.question_type,
            // Assertion-Reason statements (only present for ASSERTION_REASON).
            assertion_text: q.assertion_text,
            reason_text: q.reason_text,
            options: q.choices
              ?.slice()
              .sort(
                (a: any, b: any) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0),
              )
              .map((choice: any) => ({
                id: choice.id.toString(),
                text: choice.text,
                image: choice.image,
              })),
            // Marks come from the API as decimal strings; marks_wrong is the
            // negative deduction. Fall back to the common +4 / -1 scheme.
            marks_correct: Number(q.marks_correct ?? 4),
            marks_incorrect: Number(q.marks_wrong ?? q.marks_incorrect ?? -1),
            selected_options:
              q.selected_options ??
              q.selected_choices ??
              q.response?.selected_options,
          });

          return acc;
        }, {});

        examData = {
          name: "Assessment",
          duration_minutes: durationMinutes,
          sections: Object.keys(groupedQuestions).map((subject, index) => ({
            id: index + 1,
            name: subject,
            questions: groupedQuestions[subject],
          })),
        };
      } else if (Array.isArray(raw)) {
        examData = {
          sections: raw,
          duration_minutes: durationMinutes,
        };
      } else if (raw?.results && Array.isArray(raw.results)) {
        examData = {
          sections: raw.results,
          duration_minutes: durationMinutes,
        };
      } else {
        examData = raw;
      }

      // Fallback duration from prop if API doesn't provide it
      if (!examData?.duration_minutes) {
        examData = { ...examData, duration_minutes: durationMinutes };
      }

      // Hydrate previously saved responses from the top-level `existing_answers`
      // map returned by the student questions endpoint (keyed by question id).
      const existing: Record<string, any> = raw?.existing_answers ?? {};
      const savedAnswers: Record<string, string[]> = {};
      const savedStatuses: Record<string, QuestionStatus> = {};
      Object.entries(existing).forEach(([qId, val]: [string, any]) => {
        const ids: any[] = val?.selected_choice_ids ?? [];
        // NUMERICAL responses are persisted as a numeric value rather than
        // choice ids; we hold it locally as a single-element string array.
        const numeric = val?.numeric_answer ?? val?.numeric_value ?? null;
        const hasNumeric =
          numeric !== null && numeric !== undefined && String(numeric) !== "";
        if (Array.isArray(ids) && ids.length > 0) {
          savedAnswers[qId] = ids.map((v: any) => String(v));
        } else if (hasNumeric) {
          savedAnswers[qId] = [String(numeric)];
        }
        if (val?.is_marked_for_review) {
          savedStatuses[qId] = "marked";
        } else if (ids?.length > 0 || hasNumeric) {
          savedStatuses[qId] = "answered";
        }
      });
      if (
        Object.keys(savedAnswers).length > 0 ||
        Object.keys(savedStatuses).length > 0
      ) {
        setAnswers(savedAnswers);
        setQStatuses(savedStatuses);
      }

      setExam(examData);
      setTimeLeft((examData.duration_minutes ?? 60) * 60);
    } catch (error) {
      console.log("QUESTIONS ERROR:", error);
      Alert.alert(
        "Error",
        "Failed to load questions. Please go back and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Countdown timer ──
  useEffect(() => {
    if (!exam) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
      setTimeTaken((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam]);

  // ── AppState / tab-switch detection ──
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appStateRef.current === "active" &&
          (nextState === "background" || nextState === "inactive")
        ) {
          setTabSwitchCount((prev) => {
            const newCount = prev + 1;
            setShowTabWarning(true);
            if (tabWarningTimeout.current)
              clearTimeout(tabWarningTimeout.current);
            tabWarningTimeout.current = setTimeout(
              () => setShowTabWarning(false),
              4000,
            );
            return newCount;
          });
        }
        appStateRef.current = nextState;
      },
    );
    return () => {
      subscription.remove();
      if (tabWarningTimeout.current) clearTimeout(tabWarningTimeout.current);
    };
  }, []);

  // ── Loading / empty guard ──
  if (loading || !exam) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ marginTop: 12, color: "#9898B0" }}>Loading exam...</Text>
      </SafeAreaView>
    );
  }

  if (!exam.sections || exam.sections.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ color: "#9898B0" }}>
          No questions found for this assessment.
        </Text>
        {onBackToAssessments && (
          <TouchableOpacity
            onPress={onBackToAssessments}
            style={{ marginTop: 16 }}
          >
            <Text style={{ color: "#6C5CE7", fontWeight: "600" }}>
              ← Go Back
            </Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  const activeSection = exam.sections[activeSectionIdx];
  const activeQuestion = activeSection?.questions?.[activeQIdx];

  const getCurrentQuestionId = () => activeQuestion?.id;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Save answer to server (tracked for await on submit) ──
  const saveAnswerToServer = (
    qId: any,
    selectedOptions: string[],
    markedForReview = false,
  ) => {
    // Choice IDs are integers per the API schema (ChoiceAdmin.id). We hold
    // them as strings locally for UI equality checks; coerce back to numbers
    // before sending so the backend actually persists the response.
    const numericOptions = selectedOptions
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));

    const savePromise = updateAssessmentResponsesService(attemptId, qId, {
      selected_choice_ids: numericOptions,
      is_marked_for_review: markedForReview,
      time_spent_seconds: 0,
    })
      .then((r) => {
        console.log("SAVE OK for question", qId, "status:", (r as any)?.status);
        return r;
      })
      .catch((e) => {
        console.log("SAVE ANSWER ERROR for question", qId, ":", e);
      });

    pendingSaves.current.add(savePromise);
    savePromise.finally(() => {
      pendingSaves.current.delete(savePromise);
    });

    return savePromise;
  };

  // ── Save a NUMERICAL answer to the server ──
  // The student questions/responses endpoints aren't fully described in the
  // OpenAPI spec, so the field name `numeric_answer` is our best-fit guess that
  // mirrors the existing `selected_choice_ids` / `is_marked_for_review` payload.
  const saveNumericToServer = (
    qId: any,
    value: string,
    markedForReview = false,
  ) => {
    const trimmed = (value ?? "").trim();

    const savePromise = updateAssessmentResponsesService(attemptId, qId, {
      numeric_answer: trimmed === "" ? null : trimmed,
      selected_choice_ids: [],
      is_marked_for_review: markedForReview,
      time_spent_seconds: 0,
    })
      .then((r) => {
        console.log("NUMERIC SAVE OK for question", qId);
        return r;
      })
      .catch((e) => {
        console.log("NUMERIC SAVE ERROR for question", qId, ":", e);
      });

    pendingSaves.current.add(savePromise);
    savePromise.finally(() => {
      pendingSaves.current.delete(savePromise);
    });

    return savePromise;
  };

  const handleNumericChange = (text: string) => {
    const qId = getCurrentQuestionId();
    if (!qId) return;

    const hasValue = text.trim() !== "";

    // Store as a single-element array to stay compatible with the rest of the
    // answer/status bookkeeping (which keys off array length).
    setAnswers((prev) => ({ ...prev, [qId]: hasValue ? [text] : [] }));
    const wasMarked = qStatuses[qId] === "marked";
    setQStatuses((prev) => ({
      ...prev,
      [qId]: wasMarked ? "marked" : hasValue ? "answered" : "not_answered",
    }));
  };

  // Persist the numeric value when the field loses focus (avoids a network
  // request on every keystroke).
  const handleNumericBlur = () => {
    const qId = getCurrentQuestionId();
    if (!qId) return;
    saveNumericToServer(qId, answers[qId]?.[0] ?? "", qStatuses[qId] === "marked");
  };

  const handleOptionSelect = (optionId: string) => {
    const qId = getCurrentQuestionId();
    if (!qId) return;

    const isMulti = isMultiSelectType(activeQuestion.type);
    const current = answers[qId] || [];

    let newSelection: string[];
    if (isMulti) {
      newSelection = current.includes(optionId)
        ? current.filter((o) => o !== optionId)
        : [...current, optionId];
    } else {
      newSelection = [optionId];
    }

    // Optimistically update local state first for snappy UX
    setAnswers((prev) => ({ ...prev, [qId]: newSelection }));
    const wasMarked = qStatuses[qId] === "marked";
    setQStatuses((prev) => ({
      ...prev,
      [qId]: wasMarked
        ? "marked"
        : newSelection.length > 0
          ? "answered"
          : "not_answered",
    }));

    // Persist the FULL current selection (not just the tapped option)
    saveAnswerToServer(qId, newSelection, wasMarked);
  };

  const handleMarkForReview = () => {
    const qId = getCurrentQuestionId();
    if (!qId) return;
    setQStatuses((prev) => ({ ...prev, [qId]: "marked" }));
    if (isNumericalType(activeQuestion?.type)) {
      saveNumericToServer(qId, answers[qId]?.[0] ?? "", true);
    } else {
      saveAnswerToServer(qId, answers[qId] ?? [], true);
    }
  };

  const handleSaveAndNext = () => {
    const qId = getCurrentQuestionId();
    const hasAnswer = (answers[qId] || []).length > 0;

    // Numeric answers are saved on blur, but a tap straight on "Save & Next"
    // may skip the blur — flush the current value before navigating away.
    if (qId && isNumericalType(activeQuestion?.type)) {
      saveNumericToServer(qId, answers[qId]?.[0] ?? "", qStatuses[qId] === "marked");
    }
    if (qId && !qStatuses[qId]) {
      setQStatuses((prev) => ({
        ...prev,
        [qId]: hasAnswer ? "answered" : "not_answered",
      }));
    }

    if (activeQIdx < activeSection.questions.length - 1) {
      const nextQId = activeSection.questions[activeQIdx + 1].id;
      setActiveQIdx(activeQIdx + 1);
      setQStatuses((prev) => ({
        ...prev,
        [nextQId]: prev[nextQId] || "not_answered",
      }));
    } else if (activeSectionIdx < exam.sections.length - 1) {
      const nextSection = exam.sections[activeSectionIdx + 1];
      const nextQId = nextSection.questions[0].id;
      setActiveSectionIdx(activeSectionIdx + 1);
      setActiveQIdx(0);
      setQStatuses((prev) => ({
        ...prev,
        [nextQId]: prev[nextQId] || "not_answered",
      }));
    }
  };

  const handlePrev = () => {
    if (activeQIdx > 0) {
      setActiveQIdx(activeQIdx - 1);
    } else if (activeSectionIdx > 0) {
      const prevSection = exam.sections[activeSectionIdx - 1];
      setActiveSectionIdx(activeSectionIdx - 1);
      setActiveQIdx(prevSection.questions.length - 1);
    }
  };

  const handleNext = () => {
    if (activeQIdx < activeSection.questions.length - 1) {
      setActiveQIdx(activeQIdx + 1);
    } else if (activeSectionIdx < exam.sections.length - 1) {
      setActiveSectionIdx(activeSectionIdx + 1);
      setActiveQIdx(0);
    }
  };

  const getAllQuestions = () => exam.sections.flatMap((s: any) => s.questions);

  const getSubmitSummary = () => {
    const allQs = getAllQuestions();
    let answered = 0,
      notAnswered = 0,
      markedForReview = 0,
      notVisited = 0;
    allQs.forEach((q: any) => {
      const status = qStatuses[q.id];
      const hasAnswer = (answers[q.id] || []).length > 0;
      if (!status) notVisited++;
      else if (status === "answered" && hasAnswer) answered++;
      else if (status === "marked") markedForReview++;
      else notAnswered++;
    });
    return { answered, notAnswered, markedForReview, notVisited };
  };

  const getSectionSummary = () =>
    exam.sections.map((section: any) => {
      let ans = 0,
        notAns = 0;
      section.questions.forEach((q: any) => {
        if ((answers[q.id] || []).length > 0) ans++;
        else notAns++;
      });
      return {
        name: section.name,
        total: section.questions.length,
        answered: ans,
        notAnswered: notAns,
      };
    });

  const handleFinalSubmit = async () => {
    if (isSubmitting) {
      console.log("Submit already in progress, ignoring duplicate tap");
      return;
    }

    try {
      setIsSubmitting(true);
      setShowSubmitModal(false);

      // Wait for any in-flight answer saves to complete before submitting.
      // This is the critical fix — without this, /submit/ can race with PUTs
      // and the backend snapshots an incomplete set of responses.
      if (pendingSaves.current.size > 0) {
        console.log(
          "Waiting for",
          pendingSaves.current.size,
          "pending answer saves to finish...",
        );
        await Promise.all(Array.from(pendingSaves.current));
        console.log("All pending saves completed.");
      }

      console.log("Submitting attempt:", attemptId);

      const response = await assessmentSubmitService(attemptId);

      console.log("SUBMIT RESPONSE:", JSON.stringify(response, null, 2));

      onSubmit(answers, timeTaken);
    } catch (error: any) {
      console.log(
        "SUBMIT ERROR:",
        JSON.stringify(
          error?.response?.data || error?.message || error,
          null,
          2,
        ),
      );

      Alert.alert("Error", "Submission failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  const qNumberInSection = activeQIdx + 1;
  const totalInSection = activeSection?.questions?.length ?? 0;
  const selectedOptions = answers[getCurrentQuestionId()] || [];
  const summary = getSubmitSummary();
  const sectionSummary = getSectionSummary();
  const sectionAnswered = exam.sections.map(
    (s: any) =>
      s.questions.filter((q: any) => (answers[q.id] || []).length > 0).length,
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.examLabel}>Mock Test</Text>
          <Text style={styles.examName}>{exam?.name ?? "Assessment"}</Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>TIME LEFT</Text>
          <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
        </View>

        <TouchableOpacity
          style={styles.submitTopBtn}
          onPress={() => setShowSubmitModal(true)}
          disabled={isSubmitting}
        >
          <Text style={styles.submitTopBtnText}>⚑ Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Tab switch warning */}
      {showTabWarning && (
        <View style={styles.tabWarningBanner}>
          <Text style={styles.tabWarningIcon}>⚠</Text>
          <Text style={styles.tabWarningText}>
            Tab switch detected ({tabSwitchCount} time
            {tabSwitchCount > 1 ? "s" : ""}). This is being recorded.
          </Text>
        </View>
      )}

      {/* Section tabs */}
      <View style={styles.sectionTabsRow}>
        {exam.sections.map((section: any, idx: number) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionTab,
              activeSectionIdx === idx && styles.sectionTabActive,
            ]}
            onPress={() => {
              setActiveSectionIdx(idx);
              setActiveQIdx(0);
            }}
          >
            <Text
              style={[
                styles.sectionTabText,
                activeSectionIdx === idx && styles.sectionTabTextActive,
              ]}
            >
              {section.name}
            </Text>

            <Text
              style={[
                styles.sectionTabCount,
                activeSectionIdx === idx && styles.sectionTabCountActive,
              ]}
            >
              {sectionAnswered[idx]}/
              {section.total_questions ?? section.questions?.length ?? 0}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Question content */}
      {activeQuestion ? (
        <ScrollView
          style={styles.questionScroll}
          contentContainerStyle={styles.questionScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.qMetaRow}>
            <Text style={styles.qNumber}>
              Q {qNumberInSection} of {totalInSection}
            </Text>

            <View style={styles.qTypeBadge}>
              <Text style={styles.qTypeText}>{activeQuestion.type}</Text>
            </View>

            <View style={styles.marksBadges}>
              <View style={styles.correctMarkBadge}>
                <Text style={styles.marksBadgeText}>
                  +{activeQuestion.marks_correct} marks
                </Text>
              </View>

              <View style={styles.wrongMarkBadge}>
                <Text style={styles.marksBadgeText}>
                  {activeQuestion.marks_incorrect} marks
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.questionText}>
            {stripHtml(activeQuestion.text)}
          </Text>
          {activeQuestion.image && (
            <Image
              source={{ uri: activeQuestion.image }}
              style={{
                width: "50%",
                height: 100,
                resizeMode: "contain",
                borderRadius: 8,
                alignSelf: "center",
              }}
            />
          )}

          {/* Assertion-Reason: show the A and R statements before the options */}
          {isAssertionReasonType(activeQuestion.type) && (
            <>
              {!!activeQuestion.assertion_text && (
                <View style={styles.arCard}>
                  <Text style={styles.arLabel}>Assertion (A)</Text>
                  <Text style={styles.arText}>
                    {stripHtml(activeQuestion.assertion_text)}
                  </Text>
                </View>
              )}
              {!!activeQuestion.reason_text && (
                <View style={styles.arCard}>
                  <Text style={styles.arLabel}>Reason (R)</Text>
                  <Text style={styles.arText}>
                    {stripHtml(activeQuestion.reason_text)}
                  </Text>
                </View>
              )}
            </>
          )}

          {isNumericalType(activeQuestion.type) ? (
            /* Numerical: free-text numeric input */
            <View>
              <Text style={styles.selectLabel}>Enter your answer</Text>
              <TextInput
                style={[
                  styles.numericInput,
                  selectedOptions.length > 0 && styles.numericInputFilled,
                ]}
                value={selectedOptions[0] ?? ""}
                onChangeText={handleNumericChange}
                onEndEditing={handleNumericBlur}
                onBlur={handleNumericBlur}
                keyboardType={
                  Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"
                }
                placeholder="Type a numeric value"
                placeholderTextColor="#B6B6C8"
                returnKeyType="done"
              />
              <Text style={styles.numericHint}>
                Decimals and negative values are allowed.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.selectLabel}>
                {isMultiSelectType(activeQuestion.type)
                  ? "Select one or more correct options"
                  : "Select one correct option"}
              </Text>

              {activeQuestion.options?.map((option: any, index: number) => {
                const isSelected = selectedOptions.includes(option.id);
                const multi = isMultiSelectType(activeQuestion.type);

                return (
                  <TouchableOpacity
                    key={option.id ?? String.fromCharCode(65 + index)}
                    style={[
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                    ]}
                    onPress={() => handleOptionSelect(option.id)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.optionBubble,
                        // Square the bubble for multi-select so it reads as a checkbox.
                        multi && { borderRadius: 8 },
                        isSelected && styles.optionBubbleSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionBubbleText,
                          isSelected && styles.optionBubbleTextSelected,
                        ]}
                      >
                        {multi && isSelected
                          ? "✓"
                          : String.fromCharCode(65 + index)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {stripHtml(option.text)}
                      </Text>

                      {option.image && (
                        <Image
                          source={{ uri: option.image }}
                          style={{
                            width: "100%",
                            height: 120,
                            resizeMode: "contain",
                            marginTop: 8,
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#9898B0" }}>No question available.</Text>
        </View>
      )}

      {/* Bottom action row */}
      <View style={styles.bottomActionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleMarkForReview}
        >
          <Text style={styles.actionBtnText}>🔖 Mark for Review</Text>
        </TouchableOpacity>

        <View style={styles.notVisitedDot} />
        <Text style={styles.notVisitedLabel}>Not Answered</Text>
      </View>

      {/* Nav row */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrev}>
          <Text style={styles.navBtnText}>‹ Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveNextBtn}
          onPress={handleSaveAndNext}
        >
          <Text style={styles.saveNextBtnText}>💾 Save & Next</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
          <Text style={styles.navBtnText}>Next ›</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalWarningIcon}>⚠</Text>

                <View>
                  <Text style={styles.modalTitle}>Submit Exam?</Text>
                  <Text style={styles.modalSubtitle}>
                    This action cannot be undone.
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setShowSubmitModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalStatsRow}>
              <View style={[styles.modalStatBox, styles.modalStatBoxGreen]}>
                <Text style={styles.modalStatValue}>{summary.answered}</Text>
                <Text style={[styles.modalStatLabel, { color: "#22C55E" }]}>
                  Answered
                </Text>
              </View>

              <View style={[styles.modalStatBox, styles.modalStatBoxRed]}>
                <Text style={styles.modalStatValue}>{summary.notAnswered}</Text>
                <Text style={[styles.modalStatLabel, { color: "#EF4444" }]}>
                  Not Answered
                </Text>
              </View>
            </View>

            {(summary.markedForReview > 0 || summary.notVisited > 0) && (
              <View style={styles.modalStatsRow}>
                <View style={[styles.modalStatBox, styles.modalStatBoxPurple]}>
                  <Text style={styles.modalStatValue}>
                    {summary.markedForReview}
                  </Text>
                  <Text style={[styles.modalStatLabel, { color: "#6C5CE7" }]}>
                    Marked
                  </Text>
                </View>

                <View style={[styles.modalStatBox, styles.modalStatBoxGray]}>
                  <Text style={styles.modalStatValue}>{summary.notVisited}</Text>
                  <Text style={[styles.modalStatLabel, { color: "#9898B0" }]}>
                    Not Visited
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.goBackBtn}
                onPress={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.goBackBtnText}>Go Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitExamBtn}
                onPress={handleFinalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitExamBtnText}>⚑ Submit Exam</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
