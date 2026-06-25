import {
  assessmentSubmitService,
  updateAssessmentResponsesService,
  AssessmentResult,
} from "@/src/libs/services/assessments-attempts";
import { stripHtml } from "@/src/libs/utils/html";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  BackHandler,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getassessmentsQuestionsService } from "../../libs/services/assessments";
import {
  EXAM_BACKGROUND_GRACE_MS,
  clearActiveAttempt,
  saveActiveAttempt,
} from "../../libs/utils/examSession";
import QuestionPalette, { PaletteStatus } from "../common/QuestionPalette";
import { examScreenStyles as styles } from "@/src/styles/styles/assessments/examscreenstyles";

interface Props {
  assessmentId: number;
  attemptId: number;
  durationMinutes: number;
  onSubmit: (
    answers: Record<string, string[]>,
    timeTakenSeconds: number,
    result?: AssessmentResult | null,
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
  // Absolute epoch-ms the attempt ends. The countdown is derived from this on
  // every tick / resume, so a suspended JS timer (app-switch, screen-lock)
  // can't desync it from real elapsed time.
  const [deadline, setDeadline] = useState<number | null>(null);
  // Timestamp the app was backgrounded at, used to measure the grace window.
  const backgroundedAtRef = useRef<number | null>(null);
  // Pending submit fired while the app stays in the background past the grace
  // window (best-effort — JS may be suspended; the on-return check is fallback).
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Calls the freshest handleFinalSubmit from inside long-lived effects.
  const finalSubmitRef = useRef<() => void>(() => {});

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
  const [showPalette, setShowPalette] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

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
      const total = (examData.duration_minutes ?? 60) * 60;
      setTimeLeft(total);
      // Anchor the countdown to a wall-clock deadline and register the attempt
      // so a killed app can be auto-submitted on next launch.
      const dl = Date.now() + total * 1000;
      setDeadline(dl);
      saveActiveAttempt({ kind: "assessment", attemptId, deadline: dl });
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

  // ── Wall-clock countdown ──
  // Recompute time left from the deadline each tick (and immediately on
  // mount/resume) so suspended JS timers can't drift the clock.
  useEffect(() => {
    if (deadline == null) return;
    const total = (exam?.duration_minutes ?? durationMinutes ?? 60) * 60;
    const sync = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setTimeLeft(left);
      setTimeTaken(total - left);
      if (left <= 0) finalSubmitRef.current();
      return left;
    };
    sync();
    const interval = setInterval(() => {
      if (sync() <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  // ── AppState / tab-switch detection ──
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appStateRef.current === "active" &&
          (nextState === "background" || nextState === "inactive")
        ) {
          // Start the grace clock — leaving past the window auto-submits.
          backgroundedAtRef.current = Date.now();
          // Submit once the grace window elapses even while still away.
          if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
          graceTimerRef.current = setTimeout(
            () => finalSubmitRef.current(),
            EXAM_BACKGROUND_GRACE_MS,
          );
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
        } else if (nextState === "active") {
          // Returned to the app: the wall-clock timer self-corrects on resume.
          if (graceTimerRef.current) {
            clearTimeout(graceTimerRef.current);
            graceTimerRef.current = null;
          }
          // Fallback: if JS was suspended and the timer never fired, submit now.
          if (backgroundedAtRef.current != null) {
            const away = Date.now() - backgroundedAtRef.current;
            backgroundedAtRef.current = null;
            if (away >= EXAM_BACKGROUND_GRACE_MS) finalSubmitRef.current();
          }
        }
        appStateRef.current = nextState;
      },
    );
    return () => {
      subscription.remove();
      if (tabWarningTimeout.current) clearTimeout(tabWarningTimeout.current);
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
    };
  }, []);

  // ── Android hardware back ──
  // An ongoing attempt can't be abandoned — close any open sheet first,
  // otherwise route to the submit confirmation rather than navigating back.
  useEffect(() => {
    const onBackPress = () => {
      if (isSubmitting) return true;
      if (showPalette) { setShowPalette(false); return true; }
      if (showSubmitModal) { setShowSubmitModal(false); return true; }
      setShowSubmitModal(true);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [showPalette, showSubmitModal, isSubmitting]);

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
    const isMarked = qStatuses[qId] === "marked";
    const hasAnswer = (answers[qId] || []).length > 0;
    const next = isMarked ? (hasAnswer ? "answered" : "not_answered") : "marked";
    setQStatuses((prev) => ({ ...prev, [qId]: next }));
    if (isNumericalType(activeQuestion?.type)) {
      saveNumericToServer(qId, answers[qId]?.[0] ?? "", !isMarked);
    } else {
      saveAnswerToServer(qId, answers[qId] ?? [], !isMarked);
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
      await clearActiveAttempt();

      console.log("SUBMIT RESPONSE:", JSON.stringify(response, null, 2));

      // The submit response IS the result payload (same shape as /result/),
      // so hand it straight to the results screen to render without a re-fetch.
      const result =
        ((response as any)?.data ?? (response as any)) as AssessmentResult | null;
      onSubmit(answers, timeTaken, result);
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
  // Keep the ref pointed at the freshest closure for the timer / AppState hooks.
  finalSubmitRef.current = handleFinalSubmit;

  const selectedOptions = answers[getCurrentQuestionId()] || [];
  const summary = getSubmitSummary();

  // Flat question list (with section/index mapping) drives the palette, the
  // header progress bar, the Q n/total label and the submit copy.
  const flatQuestions = exam.sections.flatMap((s: any, si: number) =>
    (s.questions ?? []).map((q: any, qi: number) => ({ q, si, qi })),
  );
  const totalQ = flatQuestions.length;
  const currentFlatIdx = flatQuestions.findIndex(
    ({ si, qi }: any) => si === activeSectionIdx && qi === activeQIdx,
  );
  const currentQId = getCurrentQuestionId();
  const isMarked = qStatuses[currentQId] === "marked";
  const isLast =
    activeSectionIdx === exam.sections.length - 1 &&
    activeQIdx === activeSection.questions.length - 1;
  const isFirst = activeSectionIdx === 0 && activeQIdx === 0;
  const isTimeLow = timeLeft < 300;

  const paletteItems = flatQuestions.map(({ q, si, qi }: any) => {
    const status = qStatuses[q.id];
    const hasAnswer = (answers[q.id] || []).length > 0;
    const pStatus: PaletteStatus =
      status === "marked" ? "marked" : hasAnswer ? "answered" : "not_answered";
    return {
      key: String(q.id ?? `${si}-${qi}`),
      status: pStatus,
      isCurrent: si === activeSectionIdx && qi === activeQIdx,
    };
  });

  // Thin segment colours for the header progress bar (mirrors the mock screen).
  const progressSegs = flatQuestions.map(({ q, si, qi }: any) => {
    const isCurrent = si === activeSectionIdx && qi === activeQIdx;
    const status = qStatuses[q.id];
    const hasAnswer = (answers[q.id] || []).length > 0;
    if (isCurrent) return "#3B7DF8";
    if (status === "answered" && hasAnswer) return "#3B7DF8";
    if (status === "marked") return "#F59E0B";
    return "#E5E7EB";
  });

  const handlePaletteJump = (idx: number) => {
    const target = flatQuestions[idx];
    if (!target) return;
    setActiveSectionIdx(target.si);
    setActiveQIdx(target.qi);
    setShowPalette(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1117" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          // An ongoing attempt can't simply be abandoned — the close button
          // routes to the submit flow rather than navigating back.
          onPress={() => setShowSubmitModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={18} color="#555" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {exam?.name ?? "Assessment"}
          </Text>
          <Text style={styles.headerSub}>Live · Sample</Text>
          {/* Progress bar */}
          <View style={styles.progressBar}>
            {progressSegs.map((color: string, i: number) => (
              <View key={i} style={[styles.progressSeg, { backgroundColor: color }]} />
            ))}
          </View>
        </View>
        <View style={[styles.timerChip, isTimeLow && styles.timerChipRed]}>
          <Ionicons name="time-outline" size={12} color={isTimeLow ? "#EF4444" : "#555"} />
          <Text style={[styles.timerText, isTimeLow && { color: "#EF4444" }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setShowPalette(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Tab switch warning */}
      {showTabWarning && (
        <View style={styles.tabWarningBanner}>
          <Ionicons name="warning-outline" size={14} color="#B45309" />
          <Text style={styles.tabWarningText}>
            Tab switch detected ({tabSwitchCount} time
            {tabSwitchCount > 1 ? "s" : ""}). This is being recorded.
          </Text>
        </View>
      )}

      {/* Question content */}
      {activeQuestion ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Q label + Mark */}
          <View style={styles.qMetaRow}>
            <Text style={styles.qLabel}>
              QUESTION {currentFlatIdx + 1} / {totalQ}
            </Text>
            <View style={styles.marksRow}>
              <View style={[styles.marksChip, styles.marksChipPositive]}>
                <Text style={[styles.marksChipText, styles.marksChipTextPositive]}>
                  +{activeQuestion.marks_correct}
                </Text>
              </View>
              <View style={[styles.marksChip, styles.marksChipNegative]}>
                <Text style={[styles.marksChipText, styles.marksChipTextNegative]}>
                  {activeQuestion.marks_incorrect > 0
                    ? `-${activeQuestion.marks_incorrect}`
                    : activeQuestion.marks_incorrect}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.markBtn, isMarked && styles.markBtnActive]}
              onPress={handleMarkForReview}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isMarked ? "bookmark" : "bookmark-outline"}
                size={14}
                color={isMarked ? "#F59E0B" : "#9CA3AF"}
              />
              <Text style={[styles.markText, isMarked && styles.markTextActive]}>
                {isMarked ? "Marked" : "Mark"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.questionText}>{stripHtml(activeQuestion.text ?? "")}</Text>
          {activeQuestion.image && (
            <Image source={{ uri: activeQuestion.image }} style={styles.questionImage} />
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
            <View style={styles.optionsList}>
              {activeQuestion.options?.map((option: any, index: number) => {
                const isSelected = selectedOptions.includes(option.id);
                const multi = isMultiSelectType(activeQuestion.type);

                return (
                  <TouchableOpacity
                    key={option.id ?? String.fromCharCode(65 + index)}
                    style={[styles.optRow, isSelected && styles.optRowSelected]}
                    onPress={() => handleOptionSelect(option.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.optLetter,
                        multi && { borderRadius: 8 },
                        isSelected && styles.optLetterSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optLetterText,
                          isSelected && styles.optLetterTextSelected,
                        ]}
                      >
                        {multi && isSelected ? "✓" : String.fromCharCode(65 + index)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optText, isSelected && styles.optTextSelected]}>
                        {stripHtml(option.text)}
                      </Text>

                      {option.image && (
                        <Image source={{ uri: option.image }} style={styles.optImage} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.swipeHint}>— Swipe to move between questions —</Text>
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

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.prevBtn, isFirst && styles.prevBtnDisabled]}
            onPress={handlePrev}
            disabled={isFirst}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color={isFirst ? "#C7CBD3" : "#555"} />
            <Text style={[styles.prevBtnText, isFirst && { color: "#C7CBD3" }]}>Prev</Text>
          </TouchableOpacity>
          {isLast ? (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Submit</Text>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleSaveAndNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Question palette */}
      <QuestionPalette
        visible={showPalette}
        onClose={() => setShowPalette(false)}
        items={paletteItems}
        answeredCount={summary.answered}
        totalCount={flatQuestions.length}
        onJump={handlePaletteJump}
        onSubmit={() => {
          setShowPalette(false);
          setTimeout(() => setShowSubmitModal(true), 300);
        }}
        insetsBottom={insets.bottom}
      />

      {/* Submit confirmation sheet */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <TouchableOpacity
          style={styles.submitOverlay}
          activeOpacity={1}
          onPress={() => setShowSubmitModal(false)}
        >
          <View style={[styles.submitSheet, { paddingBottom: 24 + insets.bottom }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.submitSheetTitle}>Submit attempt?</Text>
            <Text style={styles.submitSheetDesc}>
              You&apos;ve answered{" "}
              <Text style={{ fontWeight: "700" }}>
                {summary.answered} of {totalQ}
              </Text>
              .
              {summary.markedForReview > 0
                ? ` ${summary.markedForReview} marked for review.`
                : ""}
              {"\n"}You can&apos;t change answers after submitting.
            </Text>
            <View style={styles.submitSheetBtns}>
              <TouchableOpacity
                style={styles.keepGoingBtn}
                onPress={() => setShowSubmitModal(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.keepGoingText}>Keep going</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitNowBtn}
                onPress={handleFinalSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitNowText}>Submit now</Text>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

