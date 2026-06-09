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

// Circular progress ring component
export const AccuracyRing = ({
  pct,
  size = 56,
  stroke = 4,
  fontSize = 13,
}: {
  pct: number | null;
  size?: number;
  stroke?: number;
  fontSize?: number;
}) => {
  const color = pct !== null ? getAccuracyColor(pct) : "#D1D5DB";
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = pct !== null ? (pct / 100) * circumference : 0;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: "#E5E7EB",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: pct !== null ? color : "transparent",
          borderRightColor: "transparent",
          borderBottomColor: pct !== null && pct > 50 ? color : "transparent",
          transform: [{ rotate: "-90deg" }],
        }}
      />
      <Text style={{ fontSize, fontWeight: "800", color: pct !== null ? color : "#9CA3AF" }}>
        {pct !== null ? pct : "—"}
      </Text>
    </View>
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
      setError(err instanceof Error ? err.message : "Failed to load syllabus.");
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
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