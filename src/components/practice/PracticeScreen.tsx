import { useTargetExam } from "@/src/libs/context/TagretExamContext";
import { getExamSyllabusService } from "@/src/libs/services/practice";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PracticeExamFlow from "./PracticeExamFlow";
import TopicsScreen from "./TopicScreen";
import SubTopicsScreen from "./SubTopic";
import CircleProgress from "@/src/components/dashboard/CircleProgress";

export interface TopicItem {
  id: number;
  name: string;
  code?: string;
  order?: number;
  accuracy: number | null;
  questionCount?: number;
  hasChildren?: boolean;
}

export interface SubTopicItem {
  name: string;
  accuracy: number | null;
  questionCount?: number;
  strengthLabel?: string;
}

export interface ChapterItem {
  id: number;
  name: string;
  topics: TopicItem[];
  accuracy: number | null;
  subjectName: string;
  // When set, these IDs are used as `topic_ids` for the practice session
  // instead of the chapter's own id. An empty array means "all topics in the
  // subject" — the backend expands it (mirrors the web "all topics at once").
  topicIds?: number[];
}

export interface SubjectGroup {
  id: number;
  name: string;
  chapters: ChapterItem[];
  accuracy: number | null;
  topicCount: number;
}

type NavScreen = "subjects" | "topics" | "subtopics";

const toArray = (raw: unknown): any[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as { results?: any[]; data?: any[] | { results?: any[] } };
    if (Array.isArray(r.results)) return r.results;
    if (Array.isArray(r.data)) return r.data;
    if (r.data && typeof r.data === "object" && Array.isArray((r.data as any).results)) {
      return (r.data as { results: any[] }).results;
    }
  }
  return [];
};

const unwrap = (res: any): any =>
  res && typeof res === "object" && "data" in res ? (res as any).data : res;

// Services reject with a plain ApiError ({ status, errors }) rather than an
// Error instance, so pull a human-readable reason out of either shape.
export const extractErrorMessage = (err: any, fallback: string): string => {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const errs = err.errors;
    if (errs && typeof errs === "object") {
      const nf = errs.nonFieldErrors;
      if (Array.isArray(nf) && nf.length) return nf.join(" · ");
      // Fall back to any field-level error messages the backend returned.
      const parts = Object.values(errs).flat().filter(Boolean) as string[];
      if (parts.length) return parts.join(" · ");
    }
    if (typeof err.status === "number" && err.status > 0)
      return `${fallback} (HTTP ${err.status})`;
  }
  return fallback;
};

const parseAccuracy = (v: any): number | null => {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
};

export const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 65) return "#22C55E";
  if (accuracy >= 40) return "#F59E0B";
  return "#F97316";
};

export const getStrengthLabel = (accuracy: number | null): string => {
  if (accuracy === null) return "Not started";
  if (accuracy >= 65) return "Strong";
  if (accuracy >= 40) return "Building";
  return "Weak";
};

// Build the syllabus tree from GET /v1/exams/{id}/syllabus/.
// Shape: [{ id, name, accuracy, topics: [{ id, name, accuracy,
//           subtopics: [{ id, name, accuracy }] }] }]
// Mapped onto the screen's model: subject → SubjectGroup, its `topics` →
// `chapters` (ChapterItem), and each topic's `subtopics` → `chapter.topics`.
const normalizeSyllabus = (raw: any): SubjectGroup[] => {
  const subjects = toArray(unwrap(raw));

  return subjects.map((subj: any): SubjectGroup => {
    const subjectName = String(subj?.name ?? subj?.code ?? "Subject");
    const topicsRaw = Array.isArray(subj?.topics) ? subj.topics : [];

    const chapters: ChapterItem[] = topicsRaw.map((topic: any): ChapterItem => {
      const subtopicsRaw = Array.isArray(topic?.subtopics)
        ? topic.subtopics
        : [];
      const subtopics: TopicItem[] = subtopicsRaw.map(
        (st: any): TopicItem => ({
          id: Number(st?.id ?? 0),
          name: String(st?.name ?? ""),
          accuracy: parseAccuracy(st?.accuracy),
        })
      );
      return {
        id: Number(topic?.id ?? 0),
        name: String(topic?.name ?? ""),
        topics: subtopics,
        accuracy: parseAccuracy(topic?.accuracy),
        subjectName,
      };
    });

    return {
      id: Number(subj?.id ?? 0),
      name: subjectName,
      chapters,
      accuracy: parseAccuracy(subj?.accuracy),
      topicCount: chapters.length,
    };
  });
};

// Pick a subject glyph by name, with a neutral fallback for non-science
// subjects (e.g. "Highway Code", "Life in the UK").
const subjectEmoji = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("phys")) return "⚛️";
  if (n.includes("chem")) return "🧪";
  if (n.includes("math")) return "📐";
  if (n.includes("bio")) return "🧬";
  return "📘";
};

// Circular progress ring — a proportional arc whose sweep matches the accuracy.
export const AccuracyRing = ({
  pct,
  size = 56,
  stroke = 4,
  fontSize = 13,
  showPercent = false,
  bgColor = "#FFFFFF",
}: {
  pct: number | null;
  size?: number;
  stroke?: number;
  fontSize?: number;
  showPercent?: boolean;
  bgColor?: string;
}) => {
  const color = pct !== null ? getAccuracyColor(pct) : "#D1D5DB";

  return (
    <CircleProgress
      size={size}
      strokeWidth={stroke}
      progress={pct ?? 0}
      color={color}
      trackColor="#E9EBF2"
      bgColor={bgColor}
    >
      <Text style={{ fontSize, fontWeight: "800", color: pct !== null ? color : "#9CA3AF" }}>
        {pct !== null ? `${pct}${showPercent ? "%" : ""}` : "—"}
      </Text>
    </CircleProgress>
  );
};

export default function PracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    chapterName?: string;
    subjectName?: string;
    questionCount?: string;
    durationMinutes?: string;
    examId?: string;
  }>();

  const { activeExamId } = useTargetExam();

  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [navScreen, setNavScreen] = useState<NavScreen>("subjects");
  const [selectedSubject, setSelectedSubject] = useState<SubjectGroup | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterItem | null>(null);

  const [practiceVisible, setPracticeVisible] = useState(false);
  const [activeChapter, setActiveChapter] = useState<ChapterItem | null>(null);
  const [autoQuestionCount, setAutoQuestionCount] = useState<number | undefined>(undefined);
  const [autoTimerMinutes, setAutoTimerMinutes] = useState<number | undefined>(undefined);
  const autoLaunchHandledRef = useRef(false);

  const loadPerformance = useCallback(async (examId: number, isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      // A single call returns the full nested tree (subjects → topics →
      // subtopics), so drilling in needs no further requests.
      const res = await getExamSyllabusService(examId);
      setSubjectGroups(normalizeSyllabus(res));
    } catch (err) {
      console.log("Syllabus load error:", JSON.stringify(err));
      setError(extractErrorMessage(err, "Failed to load syllabus."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    if (activeExamId != null) loadPerformance(Number(activeExamId));
    // No target exam for the selected region → clear any stale syllabus.
    else setSubjectGroups([]);
  }, [activeExamId, loadPerformance]);

  useEffect(() => {
    if (autoLaunchHandledRef.current) return;
    if (!params?.chapterName || !params?.subjectName || !params?.examId) return;
    if (activeExamId == null) return;
    autoLaunchHandledRef.current = true;
    setActiveChapter({ id: 0, name: String(params.chapterName), subjectName: String(params.subjectName), topics: [], accuracy: null });
    const qc = Number(params.questionCount);
    const dm = Number(params.durationMinutes);
    setAutoQuestionCount(Number.isFinite(qc) && qc > 0 ? qc : undefined);
    setAutoTimerMinutes(Number.isFinite(dm) && dm > 0 ? dm : undefined);
    setPracticeVisible(true);
    router.setParams({ chapterName: undefined, subjectName: undefined, questionCount: undefined, durationMinutes: undefined, examId: undefined } as any);
  }, [params, activeExamId, router]);

  const handleSubjectPress = (subject: SubjectGroup) => {
    // The full tree is already loaded — just drill into its topics.
    setSelectedSubject(subject);
    setNavScreen("topics");
  };

  const handleTopicPress = (chapter: ChapterItem) => {
    // `chapter.topics` holds the sub-topics from the syllabus tree.
    // No sub-topics → go straight to practising the topic.
    if (chapter.topics.length === 0) {
      setActiveChapter(chapter);
      setPracticeVisible(true);
      return;
    }
    setSelectedChapter(chapter);
    setNavScreen("subtopics");
  };

 const handleSubTopicPress = (chapter: ChapterItem) => {
  setActiveChapter(chapter);
  setPracticeVisible(true);
};

  // Practise across every topic in the subject at once. An empty `topicIds`
  // tells the backend to draw from all topics under the subject.
  const handleAllTopicsPress = (subject: SubjectGroup) => {
    setActiveChapter({
      id: 0,
      name: `All ${subject.name} topics`,
      topics: [],
      accuracy: subject.accuracy,
      subjectName: subject.name,
      topicIds: [],
    });
    setPracticeVisible(true);
  };

  const handleBack = () => {
    if (navScreen === "subtopics") setNavScreen("topics");
    else if (navScreen === "topics") setNavScreen("subjects");
    else router.back();
  };

  if (navScreen === "topics" && selectedSubject) {
    return (
      <>
        <TopicsScreen
          subject={selectedSubject}
          onBack={() => setNavScreen("subjects")}
          onTopicPress={handleTopicPress}
          onAllTopicsPress={() => handleAllTopicsPress(selectedSubject)}
        />
        {activeChapter && activeExamId != null && (
          <PracticeExamFlow
            visible={practiceVisible}
            chapter={activeChapter}
            examId={Number(activeExamId)}
            initialQuestionCount={autoQuestionCount}
            initialTimerMinutes={autoTimerMinutes}
            onClose={() => {
              setPracticeVisible(false);
              setActiveChapter(null);
              if (activeExamId != null) loadPerformance(Number(activeExamId), true);
            }}
          />
        )}
      </>
    );
  }

  if (navScreen === "subtopics" && selectedChapter) {
    return (
      <>
        <SubTopicsScreen
          chapter={selectedChapter}
          onBack={() => setNavScreen("topics")}
          onSubTopicPress={handleSubTopicPress}
        />
        {activeChapter && activeExamId != null && (
          <PracticeExamFlow
            visible={practiceVisible}
            chapter={activeChapter}
            examId={Number(activeExamId)}
            initialQuestionCount={autoQuestionCount}
            initialTimerMinutes={autoTimerMinutes}
            onClose={() => {
              setPracticeVisible(false);
              setActiveChapter(null);
              if (activeExamId != null) loadPerformance(Number(activeExamId), true);
            }}
          />
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => activeExamId != null && loadPerformance(Number(activeExamId), true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Syllabus</Text>
          <Text style={styles.pageSubtitle}>
            Adaptive map — weakest areas first. Tap a subject to drill in.
          </Text>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading subjects...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="wifi-outline" size={40} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => activeExamId != null && loadPerformance(Number(activeExamId))}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardList}>
            {subjectGroups.map((subject, idx) => (
              <TouchableOpacity
                key={subject.name + idx}
                style={styles.subjectCard}
                onPress={() => handleSubjectPress(subject)}
                activeOpacity={0.75}
              >
                <AccuracyRing pct={subject.accuracy} size={56} stroke={4} fontSize={13} />
                <View style={styles.subjectIcon}>
                  <Text style={{ fontSize: 22 }}>{subjectEmoji(subject.name)}</Text>
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectMeta}>
                    {subject.chapters.length} topics ·{" "}
                    {getStrengthLabel(subject.accuracy)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
            {subjectGroups.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No subjects found</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {activeChapter && activeExamId != null && (
        <PracticeExamFlow
          visible={practiceVisible}
          chapter={activeChapter}
          examId={Number(activeExamId)}
          initialQuestionCount={autoQuestionCount}
          initialTimerMinutes={autoTimerMinutes}
          onClose={() => {
            setPracticeVisible(false);
            setActiveChapter(null);
            if (activeExamId != null) loadPerformance(Number(activeExamId), true);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#EEEFF5" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#EEEFF5",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 18,
  },
  cardList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  subjectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  subjectIcon: { marginHorizontal: 2 },
  subjectInfo: { flex: 1 },
  subjectName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  subjectMeta: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  centered: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#9CA3AF" },
  errorText: { fontSize: 14, color: "#EF4444", textAlign: "center" },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});