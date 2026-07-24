import {
  getMockAttemptQuestionsService,
  startMockTestService,
  submitMockAttemptService,
} from "@/src/libs/services/mock-library";
import {
  getOptionsSubjectsService,
  requestMockTestService,
} from "@/src/libs/services/syllabus";
import { COLORS } from "@/src/styles/styles";
import { practiceExamFlowStyles as loadStyles } from "@/src/styles/styles/practice/practiceexamflowstyles";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  View,
} from "react-native";
import PracticeQuestions, { PracticeApiQuestion } from "./PracticeQuestions";
import PracticeResults from "./PracticeResults";
import { ChapterItem, extractErrorMessage } from "./PracticeScreen";
import PracticeSettingsModal from "./PracticeSettingsModal";

type Screen = "settings" | "loading" | "questions" | "results";

export type Difficulty = "easy" | "medium" | "hard" | "mixed";

export interface AnswerState {
  // Single-select MCQ / NUMERICAL answer (choice id or typed value).
  selected: string | null;
  // MCQ_MULTIPLE selection — the ids of every option the student ticked.
  selectedIds?: string[];
  markedForReview: boolean;
  answered: boolean;
  correct: boolean | null;
}

// Helpers

const toArray = (raw: unknown): any[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as { results?: any[]; data?: any[] | { results?: any[] } };
    if (Array.isArray(r.results)) return r.results;
    if (Array.isArray(r.data)) return r.data;
    if (
      r.data &&
      typeof r.data === "object" &&
      Array.isArray((r.data as any).results)
    ) {
      return (r.data as { results: any[] }).results;
    }
  }
  return [];
};

const unwrap = (res: any): any =>
  res && typeof res === "object" && "data" in res ? (res as any).data : res;

const looksLikeQuestion = (o: any): boolean =>
  !!o &&
  typeof o === "object" &&
  o.id != null &&
  (typeof o.question_text === "string" ||
    typeof o.text === "string" ||
    typeof o.statement === "string" ||
    Array.isArray(o.choices) ||
    Array.isArray(o.options));

const findQuestionsArray = (node: any, depth = 0): any[] | null => {
  if (!node || depth > 6) return null;
  if (Array.isArray(node) && node.length > 0 && node.every(looksLikeQuestion))
    return node;
  if (typeof node === "object") {
    for (const key of Object.keys(node)) {
      const found = findQuestionsArray(node[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
};

const normalizeQuestion = (q: any): PracticeApiQuestion | null => {
  if (!q) return null;
  const realId = q.question_id ?? q.question?.id ?? q.id;
  if (realId == null) return null;

  const choicesRaw =
    q.choices ??
    q.options ??
    q.answer_options ??
    q.question?.choices ??
    q.question?.options ??
    [];
  const options = (Array.isArray(choicesRaw) ? choicesRaw : []).map(
    (c: any) => ({
      id: String(c?.id ?? c?.value ?? ""),
      text: c?.text ?? c?.label ?? String(c ?? ""),
      image: c?.image ?? null,
    }),
  );

  let correctId: string | null = null;
  const correctRaw =
    q.correct_choice_id ??
    q.correct_option_id ??
    q.correct_answer_id ??
    q.correct_choice ??
    (Array.isArray(q.correct_choice_ids) ? q.correct_choice_ids[0] : null) ??
    q.question?.correct_choice_id ??
    q.question?.correct_option_id;
  if (correctRaw != null) correctId = String(correctRaw);
  else {
    const flagged = options.find((_o: any, i: number) => {
      const orig = choicesRaw[i];
      return orig?.is_correct === true || orig?.correct === true;
    });
    if (flagged) correctId = flagged.id;
  }

  // MCQ_MULTIPLE: the full set of correct option ids. Prefer an explicit array,
  // else collect every flagged choice, else fall back to the single id above.
  const rawCorrectIds =
    q.correct_choice_ids ??
    q.correct_answers ??
    q.correct_options ??
    q.question?.correct_choice_ids ??
    null;
  let correctIds: string[] = Array.isArray(rawCorrectIds)
    ? rawCorrectIds.map((v: any) => String(v?.id ?? v)).filter(Boolean)
    : [];
  if (correctIds.length === 0) {
    correctIds = options
      .filter((_o: any, i: number) => {
        const orig = choicesRaw[i];
        return orig?.is_correct === true || orig?.correct === true;
      })
      .map((o: any) => o.id);
  }
  if (correctIds.length === 0 && correctId != null) correctIds = [correctId];

  return {
    id: realId,
    text:
      q.question_text ??
      q.text ??
      q.statement ??
      q.question?.question_text ??
      q.question?.text ??
      "",
    image: q.image ?? q.question?.image ?? null,
    type: q.question_type ?? q.type ?? q.question?.question_type ?? "MCQ",
    options,
    correctChoiceId: correctId,
    correctChoiceIds: correctIds.length > 0 ? correctIds : null,
    correctAnswer:
      q.correct_answer ??
      q.correct_numeric_answer ??
      q.numeric_answer ??
      q.question?.correct_answer ??
      null,
    explanation:
      q.explanation ??
      q.solution ??
      q.solution_text ??
      q.answer_explanation ??
      q.question?.explanation ??
      q.question?.solution ??
      "",
    marksCorrect: Number(q.marks_correct ?? q.question?.marks_correct ?? 4),
    marksIncorrect: Number(
      q.marks_incorrect ?? q.question?.marks_incorrect ?? -1,
    ),
    selectedOptions:
      q.selected_options ??
      q.selected_choices ??
      q.response?.selected_options ??
      null,
  };
};

// Component

interface PracticeExamFlowProps {
  visible: boolean;
  chapter: ChapterItem;
  examId: number;
  initialQuestionCount?: number;
  initialTimerMinutes?: number;
  /** Test mode (file icon) instead of practice. Sends test_type "TEST" and
   * defers all answer feedback until the whole test is finished. */
  isTest?: boolean;
  onClose: () => void;
  /** Called when the user finishes a session and leaves the results screen.
   * Defaults to onClose; the syllabus uses it to return to the root + refresh. */
  onCompleted?: () => void;
}

export const PracticeExamFlow = ({
  visible,
  chapter,
  examId,
  initialQuestionCount,
  initialTimerMinutes,
  isTest = false,
  onClose,
  onCompleted,
}: PracticeExamFlowProps) => {
  const [screen, setScreen] = useState<Screen>("settings");
  const [questions, setQuestions] = useState<PracticeApiQuestion[]>([]);
  const [finalQuestions, setFinalQuestions] = useState<PracticeApiQuestion[]>([]);
  const [mockId, setMockId] = useState<number | string | null>(null);
  // Attempt id from /start/ — keys the questions / responses / submit endpoints.
  const [attemptId, setAttemptId] = useState<number | string | null>(null);
  const [finalAnswers, setFinalAnswers] = useState<AnswerState[]>([]);
  const [finalSeconds, setFinalSeconds] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState<number>(0);
  const [creating, setCreating] = useState(false);
  const [submittingMock, setSubmittingMock] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setScreen("settings");
      setQuestions([]);
      setFinalQuestions([]);
      setMockId(null);
      setAttemptId(null);
      setFinalAnswers([]);
      setFinalSeconds(0);
      setLoadError(null);
    }
  }, [visible]);

  const handleBegin = async (
    count: number,
    difficulty: Difficulty,
    timer: number,
  ) => {
    if (creating) return;
    setLoadError(null);
    setTimerMinutes(timer);
    setScreen("loading");
    setCreating(true);
    try {
      const subjRes = await getOptionsSubjectsService(examId);
      const subjects = toArray(unwrap(subjRes));
      // When the exam hides subjects (display_subject = false) the syllabus has
      // no subject name to match on, but the exam still has a single subject —
      // fall back to it so the session can be created.
      const matchedSubject =
      subjects.find((s: any) => String(s?.name ?? "").toLowerCase() === chapter.subjectName.toLowerCase())
      ?? (subjects.length === 1 ? subjects[0] : undefined);
      if (!matchedSubject?.id)
        throw new Error(
          chapter.subjectName
            ? `Subject "${chapter.subjectName}" not found.`
            : "No subject found for this exam.",
        );
      const subjectId = Number(matchedSubject.id);

      // A `topicIds` override drives multi-topic sessions (e.g. "all topics at
      // once", where an empty array means every topic in the subject). Drop any
      // invalid/placeholder ids (0, NaN) — the backend rejects topic_ids: [0].
      const topicIds = (chapter.topicIds ?? [chapter.id]).filter(
        (id) => Number.isFinite(Number(id)) && Number(id) > 0,
      );

      const payload = {
        exam: examId,
        is_full_syllabus: false,
        subject_id: subjectId,
        topic_ids: topicIds,
        question_count: count,
        difficulty,
        // Test mode sends test_type "TEST" (answers revealed only at the end);
        // practice mode sends "PRACTICE_TEST" with per-question feedback.
        test_type: isTest ? ("TEST" as const) : ("PRACTICE_TEST" as const),
        // Backend requires duration >= 1; omit it for untimed sessions.
        ...(timer > 0 ? { total_duration_minutes: timer } : {}),
      };

      const createRes = await requestMockTestService(examId, payload);
      const body = unwrap(createRes);
      const newId =
        body?.id ??
        body?.mock_test_id ??
        body?.mock_id ??
        body?.data?.id ??
        body?.result?.id ??
        body?.results?.id;
      if (!newId)
        throw new Error("Practice session created but no ID returned.");
      setMockId(newId);

      // Start the attempt and capture its id — questions, response saves and
      // submit are all keyed on the attempt, not the mock.
      const startRes = await startMockTestService(newId);
      const startBody = unwrap(startRes);
      const aId = startBody?.attempt_id ?? startBody?.attempt?.id ?? null;
      if (aId == null)
        throw new Error("Could not start the practice attempt.");
      setAttemptId(aId);

      const qRes = await getMockAttemptQuestionsService(aId);
      const raw = unwrap(qRes);
      const arr =
        (Array.isArray(raw?.questions) && raw.questions) ||
        findQuestionsArray(raw) ||
        toArray(raw);
      const normalized = arr
        .map(normalizeQuestion)
        .filter(Boolean) as PracticeApiQuestion[];
      if (normalized.length === 0)
        throw new Error("No questions returned for this session.");
      setQuestions(normalized);
      setScreen("questions");
    } catch (err) {
      console.log("Practice create error:", JSON.stringify(err));
      const msg = extractErrorMessage(err, "No published questions available.");
      setLoadError(msg);
      setScreen("settings");
      Alert.alert("Error", msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEnd = async (
    answers: AnswerState[],
    seconds: number,
    finished: PracticeApiQuestion[],
  ) => {
    setFinalAnswers(answers);
    setFinalSeconds(seconds);
    setFinalQuestions(finished);
    setScreen("results");
    if (attemptId != null) {
      try {
        setSubmittingMock(true);
        await submitMockAttemptService(attemptId);
        // In test mode no per-question answer key was fetched during play
        // (feedback is deferred to the end), so pull it once after submission
        // and merge it in — the results/review screens compute outcomes from
        // each question's correctChoiceId/correctAnswer. Best-effort: if the
        // API returns no key, the played questions are kept as-is.
        if (isTest) {
          try {
            const qRes = await getMockAttemptQuestionsService(attemptId);
            const raw = unwrap(qRes);
            const arr =
              (Array.isArray(raw?.questions) && raw.questions) ||
              findQuestionsArray(raw) ||
              toArray(raw);
            const key = arr
              .map(normalizeQuestion)
              .filter(Boolean) as PracticeApiQuestion[];
            if (key.length > 0) {
              setFinalQuestions((prev) =>
                prev.map((q) => {
                  const match = key.find((k) => String(k.id) === String(q.id));
                  if (!match) return q;
                  return {
                    ...q,
                    correctChoiceId: match.correctChoiceId ?? q.correctChoiceId,
                    correctChoiceIds: match.correctChoiceIds ?? q.correctChoiceIds ?? null,
                    correctAnswer: match.correctAnswer ?? q.correctAnswer ?? null,
                    explanation: match.explanation || q.explanation,
                    explanationStructured:
                      match.explanationStructured ?? q.explanationStructured ?? null,
                  };
                }),
              );
            }
          } catch (e) {
            console.log("Test answer-key fetch error:", e);
          }
        }
      } catch (e) {
        console.log("Practice submit error:", e);
      } finally {
        setSubmittingMock(false);
      }
    }
  };

  const handleTryAgain = () => {
    setScreen("settings");
    setQuestions([]);
    setMockId(null);
    setAttemptId(null);
    setFinalAnswers([]);
    setFinalSeconds(0);
  };

  // Android hardware back for the whole flow. A Modal swallows the back press on
  // Android and routes it only here, so this is required. The questions and
  // results screens register their own BackHandler (confirm-before-exit /
  // back-to-hub) which consumes the press before it reaches the Modal; the
  // settings and loading screens have no handler of their own, so back on them
  // is routed here to cancel the flow (mirrors the in-screen "Back"/"Previous").
  const handleAndroidBack = () => {
    if (screen === "settings" || screen === "loading") {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleAndroidBack}
    >
      {screen === "settings" && (
        <PracticeSettingsModal
          chapterName={chapter.name}
          accuracy={chapter.accuracy}
          loading={creating}
          errorText={loadError}
          initialQuestionCount={initialQuestionCount}
          initialTimerMinutes={initialTimerMinutes}
          isTest={isTest}
          onBegin={handleBegin}
          onCancel={onClose}
        />
      )}

      {screen === "loading" && (
        <View style={loadStyles.container}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={loadStyles.text}>
            Preparing your {isTest ? "test" : "practice"}...
          </Text>
        </View>
      )}

      {screen === "questions" && questions.length > 0 && mockId != null && attemptId != null && (
        <PracticeQuestions
          mockId={mockId}
          attemptId={attemptId}
          questions={questions}
          chapterName={chapter.name}
          timerMinutes={timerMinutes}
          isTest={isTest}
          onEnd={handleEnd}
        />
      )}

      {screen === "results" && (
        <PracticeResults
          chapterName={chapter.name}
          attemptId={attemptId}
          questions={finalQuestions.length > 0 ? finalQuestions : questions}
          answers={finalAnswers}
          totalSeconds={finalSeconds}
          submitting={submittingMock}
          isTest={isTest}
          onTryAgain={handleTryAgain}
          onBackToHub={onCompleted ?? onClose}
        />
      )}
    </Modal>
  );
};

export default PracticeExamFlow;
