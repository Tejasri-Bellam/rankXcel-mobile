import { useTargetExam } from "@/src/libs/context/TagretExamContext";
import { getSubjectOptionsService } from "@/src/libs/services/mock-library";
import { getChapterPerformanceService, getTopicsService } from "@/src/libs/services/practice";
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

const normalizePerformance = (raw: any): SubjectGroup[] => {
  const data = unwrap(raw);
  const list = toArray(data);
  const subjectMap = new Map<string, SubjectGroup>();

  list.forEach((entry: any) => {
    if (!entry || typeof entry !== "object") return;
    const subjectName = String(entry.subject_name ?? entry.subject ?? "Subject");
    const chapterName = String(entry.chapter_name ?? entry.chapter ?? entry.name ?? "");
    if (!chapterName) return;

    if (!subjectMap.has(subjectName)) {
      subjectMap.set(subjectName, {
  id: Number(entry.subject_id ?? 0),
  name: subjectName,
  chapters: [],
  accuracy: null,
  topicCount: 0,
});
    }

    const topicsRaw = Array.isArray(entry.topics) ? entry.topics : [];
    const topics: TopicItem[] = topicsRaw.map((t: any) => ({
      name: String(t?.topic_name ?? t?.name ?? ""),
      accuracy: parseAccuracy(t?.percentage ?? t?.accuracy),
      questionCount: t?.question_count ?? t?.total_questions ?? null,
    }));

    const subjectGroup = subjectMap.get(subjectName)!;
    subjectGroup.chapters.push({
      id: Number(entry.chapter_id ?? entry.id ?? 0),
      name: chapterName,
      topics,
      accuracy: parseAccuracy(entry.percentage ?? entry.accuracy),
      subjectName,
    });
  });

  const groups = Array.from(subjectMap.values());
  groups.forEach((g) => {
    g.topicCount = g.chapters.reduce((sum, c) => sum + c.topics.length, 0);
    const accs = g.chapters.map((c) => c.accuracy).filter((a): a is number => a !== null);
    g.accuracy = accs.length > 0 ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : null;
  });

  return groups;
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
      const [perfRes, subjRes] = await Promise.all([
        getChapterPerformanceService(examId),
        getSubjectOptionsService(examId),
      ]);
      const groups = normalizePerformance(perfRes);
      const subjectsList = toArray(unwrap(subjRes));
      subjectsList.forEach((s: any) => {
        const name = String(s?.name ?? s?.code ?? "Subject");
        if (!groups.find((g) => g.name === name)) {
          groups.push({
            id: Number(s.id),
            name,
            chapters: [],
            accuracy: null,
            topicCount: 0,
          });
        }
      });
      setSubjectGroups(groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subjects.");
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

  const handleSubjectPress = async (subject: SubjectGroup) => {
  try {
    setLoading(true);

    const res = await getTopicsService(subject.id);

    const topics = toArray(unwrap(res));

    const chapters: ChapterItem[] = topics.map((topic: any) => ({
      id: topic.id,
      name: topic.name,
      accuracy: null,
      subjectName: subject.name,
      topics: [],
    }));

    setSelectedSubject({
      ...subject,
      chapters,
    });

    setNavScreen("topics");
  } catch (e) {
    console.log(e);
  } finally {
    setLoading(false);
  }
};

 const handleTopicPress = async (chapter: ChapterItem) => {
  try {
    const subject = selectedSubject;

    if (!subject) return;

    const res = await getTopicsService(
      subject.id,
      chapter.id
    );

    const children = toArray(unwrap(res));

    //
    // No children => Topic -> Questions
    //
    if (children.length === 0) {
      setActiveChapter(chapter);
      setPracticeVisible(true);
      return;
    }

    //
    // Topic -> Sub Topics
    //
    setSelectedChapter({
      ...chapter,
      topics: children.map((t: any) => ({
        id: t.id,
        name: t.name,
        accuracy: null,
      })),
    });

    setNavScreen("subtopics");
  } catch (e) {
    console.log(e);
  }
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
                  <Text style={{ fontSize: 22 }}>
                    {idx === 0 ? "📐" : idx === 1 ? "⚛️" : "🧪"}
                  </Text>
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