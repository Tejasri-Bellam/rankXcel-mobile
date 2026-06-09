import {
  createMockTestService,
  getMockTestQuestionsService,
  getSubjectOptionsService,
  startMockTestService,
  submitMockTestService
} from "@/src/libs/services/mock-library";
import { COLORS } from "@/src/styles/styles";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PracticeQuestions, { PracticeApiQuestion } from "./PracticeQuestions";
import PracticeResults from "./PracticeResults";
import { ChapterItem } from "./PracticeScreen";
import PracticeSettingsModal from "./PracticeSettingsModal";

type Screen = "settings" | "loading" | "questions" | "results";

export type Difficulty = "easy" | "medium" | "hard" | "mixed";

export interface AnswerState {
  selected: string | null;
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

  return {
    id: realId,
    text:
      q.question_text ??
      q.text ??
      q.statement ??
      q.question?.question_text ??
      q.question?.text ??
      "",
    type: q.question_type ?? q.type ?? q.question?.question_type ?? "MCQ",
    options,
    correctChoiceId: correctId,
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
  onClose: () => void;
}

export const PracticeExamFlow = ({
  visible,
  chapter,
  examId,
  initialQuestionCount,
  initialTimerMinutes,
  onClose,
}: PracticeExamFlowProps) => {
  const [screen, setScreen] = useState<Screen>("settings");
  const [questions, setQuestions] = useState<PracticeApiQuestion[]>([]);
  const [mockId, setMockId] = useState<number | string | null>(null);
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
      setMockId(null);
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
      const subjRes = await getSubjectOptionsService(examId);
      const subjects = toArray(unwrap(subjRes));
      const matchedSubject = subjects.find(
        (s: any) =>
          String(s?.name ?? "").toLowerCase() ===
          chapter.subjectName.toLowerCase(),
      );
      if (!matchedSubject?.id)
        throw new Error(`Subject "${chapter.subjectName}" not found.`);
      const subjectId = Number(matchedSubject.id);

      const topicIds = [chapter.id];

      const payload = {
        exam: examId,
        subject: subjectId,
        topic_ids: topicIds,
        question_count: count,
        total_duration_minutes: timer > 0 ? timer : 0,
        difficulty: difficulty === "mixed" ? null : difficulty,
        test_type: "PRACTICE_TEST" as const,
      };

      const createRes = await createMockTestService(payload);
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

      try {
        await startMockTestService(newId);
      } catch (e: any) {
        const code = e?.body?.code ?? e?.errors?.code?.[0];
        if (code !== "INVALID_STATE") throw e;
      }

      const qRes = await getMockTestQuestionsService(newId);
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
      const msg =
        err instanceof Error
          ? err.message
          : "No published questions available.";
      setLoadError(msg);
      setScreen("settings");
      Alert.alert("Error", msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEnd = async (answers: AnswerState[], seconds: number) => {
    setFinalAnswers(answers);
    setFinalSeconds(seconds);
    if (mockId != null) {
      try {
        setSubmittingMock(true);
        await submitMockTestService(mockId);
      } catch (e) {
        console.log("Practice submit error:", e);
      } finally {
        setSubmittingMock(false);
      }
    }
    setScreen("results");
  };

  const handleTryAgain = () => {
    setScreen("settings");
    setQuestions([]);
    setMockId(null);
    setFinalAnswers([]);
    setFinalSeconds(0);
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      {screen === "settings" && (
        <PracticeSettingsModal
          chapterName={chapter.name}
          accuracy={chapter.accuracy}
          loading={creating}
          errorText={loadError}
          initialQuestionCount={initialQuestionCount}
          initialTimerMinutes={initialTimerMinutes}
          onBegin={handleBegin}
          onCancel={onClose}
        />
      )}

      {screen === "loading" && (
        <View style={loadStyles.container}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={loadStyles.text}>Preparing your practice...</Text>
        </View>
      )}

      {screen === "questions" && questions.length > 0 && mockId != null && (
        <PracticeQuestions
          mockId={mockId}
          questions={questions}
          chapterName={chapter.name}
          timerMinutes={timerMinutes}
          onEnd={handleEnd}
        />
      )}

      {screen === "results" && (
        <PracticeResults
          chapterName={chapter.name}
          questions={questions}
          answers={finalAnswers}
          totalSeconds={finalSeconds}
          submitting={submittingMock}
          onTryAgain={handleTryAgain}
          onBackToHub={onClose}
        />
      )}
    </Modal>
  );
};

const loadStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    gap: 16,
  },
  text: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});

export default PracticeExamFlow;
