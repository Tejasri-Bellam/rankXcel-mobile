import { useTargetExam } from "@/src/libs/context/TagretExamContext";
import { useHeaderScrollHandler } from "@/src/libs/context/HeaderScrollContext";
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
import CircleProgress from "@/src/components/dashboard/CircleProgress";

// Blue accent used across the syllabus drill-down screens (matches the mockups).
const ACCENT = "#3B7DF8";

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
  // Whether this topic has sub-topics. undefined = unknown (the topics list
  // gave no hint), in which case we probe by fetching the children on tap.
  hasChildren?: boolean;
  questionCount?: number;
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

// Weak → Mastered scale used by every node's progress colour.
export const SCALE_COLORS = ["#EF4444", "#F97316", "#F59E0B", "#4ADE80", "#16A34A"];

export const getNodeColor = (accuracy: number | null): string => {
  if (accuracy == null) return SCALE_COLORS[0];
  if (accuracy >= 80) return SCALE_COLORS[4];
  if (accuracy >= 60) return SCALE_COLORS[3];
  if (accuracy >= 40) return SCALE_COLORS[2];
  if (accuracy >= 20) return SCALE_COLORS[1];
  return SCALE_COLORS[0];
};

export const getStrengthLabel = (accuracy: number | null): string => {
  if (accuracy === null) return "Not started";
  if (accuracy >= 65) return "Strong";
  if (accuracy >= 40) return "Building";
  return "Weak";
};

// Colour of the strength square next to each row (grey when unattempted).
const squareColor = (accuracy: number | null): string =>
  accuracy === null ? "#D1D5DB" : getAccuracyColor(accuracy);

// A single topic node (with its `subtopics`) → ChapterItem.
const normalizeTopic = (topic: any, subjectName: string): ChapterItem => {
  const subtopicsRaw = Array.isArray(topic?.subtopics) ? topic.subtopics : [];
  const subtopics: TopicItem[] = subtopicsRaw.map(
    (st: any): TopicItem => ({
      id: Number(st?.id ?? 0),
      name: String(st?.name ?? st?.code ?? ""),
      accuracy: parseAccuracy(st?.accuracy),
      questionCount: Number(st?.question_count ?? st?.questions_count ?? 0) || undefined,
    })
  );
  return {
    id: Number(topic?.id ?? 0),
    name: String(topic?.name ?? topic?.code ?? ""),
    topics: subtopics,
    accuracy: parseAccuracy(topic?.accuracy),
    subjectName,
    hasChildren: subtopics.length > 0,
    questionCount: Number(topic?.question_count ?? topic?.questions_count ?? 0) || undefined,
  };
};

// GET /api/v1/exams/{examId}/syllabus/ returns one of two shapes depending on
// the exam's `display_subject` setting:
//   display_subject = true  → subjects → topics → subtopics:
//     [{ id, name, accuracy, topics: [{ ..., subtopics: [...] }] }]
//   display_subject = false → topics → subtopics (no subject wrapper):
//     [{ id, name, accuracy, subtopics: [...] }]
// We detect the shape from the response (a top-level `topics` array means the
// subject layer is present) rather than relying on a flag the API doesn't send.
// Both are mapped onto the screen's model: subject → SubjectGroup, its topics →
// `chapters` (ChapterItem), and each topic's subtopics → `chapter.topics`. When
// subjects are hidden, all topics are folded into a single synthetic subject so
// the rest of the screen (and the practice flow) work unchanged.
const normalizeSyllabus = (
  raw: any
): { subjects: SubjectGroup[]; displaySubjects: boolean } => {
  const items = toArray(unwrap(raw));
  const displaySubjects = items.some((it: any) => Array.isArray(it?.topics));

  if (!displaySubjects) {
    // Topics-only: no subject in the payload. The exam still has a subject (the
    // practice flow resolves it via /options/subjects/), so leave subjectName
    // empty and let the flow fall back to the exam's sole subject.
    const chapters = items.map((topic: any) => normalizeTopic(topic, ""));
    return {
      subjects: [{ id: 0, name: "", chapters, accuracy: null, topicCount: chapters.length }],
      displaySubjects: false,
    };
  }

  const subjects = items.map((subj: any): SubjectGroup => {
    const subjectName = String(subj?.name ?? subj?.code ?? "Subject");
    const topicsRaw = Array.isArray(subj?.topics) ? subj.topics : [];
    const chapters = topicsRaw.map((topic: any) => normalizeTopic(topic, subjectName));
    return {
      id: Number(subj?.id ?? 0),
      name: subjectName,
      chapters,
      accuracy: parseAccuracy(subj?.accuracy),
      topicCount: chapters.length,
    };
  });

  return { subjects, displaySubjects: true };
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
  // Treat a missing/null accuracy as 0 so subjects, topics and subtopics
  // always show a numeric value instead of a dash.
  const acc = pct ?? 0;
  const color = getAccuracyColor(acc);

  return (
    <CircleProgress
      size={size}
      strokeWidth={stroke}
      progress={acc}
      color={color}
      trackColor="#E9EBF2"
      bgColor={bgColor}
    >
      <Text style={{ fontSize, fontWeight: "800", color }}>
        {`${acc}${showPercent ? "%" : ""}`}
      </Text>
    </CircleProgress>
  );
};

// "< Back" row + big page title — the drill-down header used by the
// topics / sub-topics screens.
const BackHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <>
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={18} color={ACCENT} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.bigTitle} numberOfLines={1}>
      {title}
    </Text>
  </>
);

// White summary card with a progress ring, strength label and a meta line.
const StatBanner = ({
  pct,
  status,
  meta,
}: {
  pct: number | null;
  status: string;
  meta: string;
}) => (
  <View style={styles.banner}>
    <AccuracyRing pct={pct} size={64} stroke={6} fontSize={15} showPercent />
    <View style={styles.bannerInfo}>
      <Text style={styles.bannerStatus}>{status}</Text>
      <Text style={styles.bannerMeta}>{meta}</Text>
    </View>
  </View>
);

// Small blue play button shown on every practisable (leaf) row.
const PlayButton = () => (
  <View style={styles.playBtn}>
    <Ionicons name="play" size={15} color={ACCENT} />
  </View>
);

// Full-width "Practice all" bar pinned below a list.
const PracticeAllBar = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.practiceAllBar} activeOpacity={0.85} onPress={onPress}>
    <View style={styles.practiceAllIcon}>
      <Ionicons name="play" size={16} color="#fff" />
    </View>
    <Text style={styles.practiceAllLabel}>{label}</Text>
    <Ionicons name="arrow-forward" size={18} color="#fff" />
  </TouchableOpacity>
);

export default function PracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    chapterName?: string;
    subjectName?: string;
    questionCount?: string;
    durationMinutes?: string;
    examId?: string;
  }>();

  const { activeExamId, targetExams } = useTargetExam();
  const onHeaderScroll = useHeaderScrollHandler();

  const examName = useMemo(
    () =>
      targetExams.find((e) => String(e.id) === String(activeExamId))?.name ?? "",
    [targetExams, activeExamId]
  );

  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  // When the exam hides subjects (display_subject = false) the syllabus root
  // lists topics directly instead of subject cards.
  const [displaySubjects, setDisplaySubjects] = useState(true);
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

  // Full syllabus tree for the active target exam
  // (GET /v1/exams/{examId}/syllabus/) — subjects → topics → subtopics.
  const loadSubjects = useCallback(async (examId: number, isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const res = await getExamSyllabusService(examId);
      const { subjects, displaySubjects } = normalizeSyllabus(res);
      setSubjectGroups(subjects);
      setDisplaySubjects(displaySubjects);
    } catch (err) {
      console.log("Syllabus load error:", JSON.stringify(err));
      setError(extractErrorMessage(err, "Failed to load syllabus."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    if (activeExamId != null) loadSubjects(Number(activeExamId));
    // No target exam for the selected region → clear any stale syllabus.
    else setSubjectGroups([]);
  }, [activeExamId, loadSubjects]);

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

  // Open the practice/test flow for any node in the tree. `timed` starts the
  // session as a timed test; otherwise it's untimed practice.
  const openPractice = (chapter: ChapterItem, timed = false) => {
    setActiveChapter(chapter);
    setAutoQuestionCount(undefined);
    setAutoTimerMinutes(timed ? 15 : undefined);
    setPracticeVisible(true);
  };

  // A leaf topic practises itself (the flow defaults topic_ids to [chapter.id]).
  const topicToChapter = (
    topic: ChapterItem,
    subject: SubjectGroup
  ): ChapterItem => ({ ...topic, subjectName: subject.name });

  // A subtopic practises just its own id.
  const subToChapter = (
    sub: TopicItem,
    subject: SubjectGroup
  ): ChapterItem => ({
    id: sub.id,
    name: sub.name,
    topics: [],
    accuracy: sub.accuracy,
    subjectName: subject.name,
    topicIds: [sub.id],
  });

  // "Practice all" for a topic — every sub-topic id, or the topic itself.
  const topicAllChapter = (
    topic: ChapterItem,
    subject: SubjectGroup
  ): ChapterItem => ({
    id: topic.id,
    name: topic.name,
    topics: [],
    accuracy: topic.accuracy,
    subjectName: subject.name,
    topicIds: topic.topics.length ? topic.topics.map((t) => t.id) : [topic.id],
  });

  // Practise across every topic in the subject at once. An empty `topicIds`
  // tells the backend to draw from all topics under the subject.
  const handleAllTopicsPress = (subject: SubjectGroup) => {
    setActiveChapter({
      id: 0,
      name: subject.name ? `All ${subject.name} topics` : "All topics",
      topics: [],
      accuracy: subject.accuracy,
      subjectName: subject.name,
      topicIds: [],
    });
    setPracticeVisible(true);
  };

  // Topic list card + "Practice all" bar — shared by the topics drill-down
  // screen and the subject-less syllabus root (display_subject = false). Topics
  // with sub-topics drill in; leaf topics start practice directly.
  const renderTopicRows = (subject: SubjectGroup) => (
    <>
      <View style={styles.listCard}>
        {subject.chapters.map((topic, idx) => {
          const hasSubs = topic.topics.length > 0;
          const isLast = idx === subject.chapters.length - 1;
          const meta = hasSubs
            ? `${topic.topics.length} sub-topic${topic.topics.length === 1 ? "" : "s"} · ${topic.accuracy ?? 0}%`
            : topic.questionCount
              ? `${topic.questionCount} questions · ${topic.accuracy ?? 0}%`
              : `${getStrengthLabel(topic.accuracy)} · ${topic.accuracy ?? 0}%`;
          return (
            <TouchableOpacity
              key={topic.id || topic.name + idx}
              style={[styles.listRow, isLast && styles.listRowLast]}
              activeOpacity={0.7}
              onPress={() => {
                if (hasSubs) {
                  setSelectedSubject(subject);
                  setSelectedChapter(topic);
                  setNavScreen("subtopics");
                } else {
                  openPractice(topicToChapter(topic, subject));
                }
              }}
            >
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{topic.name}</Text>
                <Text style={styles.listMeta}>{meta}</Text>
              </View>
              <View style={[styles.square, { backgroundColor: squareColor(topic.accuracy) }]} />
              {hasSubs ? (
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              ) : (
                <PlayButton />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {subject.chapters.length > 0 && (
        <PracticeAllBar
          label="Practice all topics"
          onPress={() => handleAllTopicsPress(subject)}
        />
      )}
    </>
  );

  // Shared practice/test modal — reused across every screen.
  const practiceModal =
    activeChapter && activeExamId != null ? (
      <PracticeExamFlow
        visible={practiceVisible}
        chapter={activeChapter}
        examId={Number(activeExamId)}
        initialQuestionCount={autoQuestionCount}
        initialTimerMinutes={autoTimerMinutes}
        onClose={() => {
          setPracticeVisible(false);
          setActiveChapter(null);
          if (activeExamId != null) loadSubjects(Number(activeExamId), true);
        }}
        onCompleted={() => {
          // After finishing a session, return to the syllabus root and reload so
          // the updated subject/topic/subtopic accuracy shows immediately
          // (drill-down screens render from stale snapshots otherwise).
          setPracticeVisible(false);
          setActiveChapter(null);
          setSelectedChapter(null);
          setSelectedSubject(null);
          setNavScreen("subjects");
          if (activeExamId != null) loadSubjects(Number(activeExamId), true);
        }}
      />
    ) : null;

  // Topics screen — the subject's topics. Topics with sub-topics drill into the
  // sub-topics screen; leaf topics show a play button that starts practice.
  if (navScreen === "topics" && selectedSubject) {
    const subject = selectedSubject;
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <BackHeader title={subject.name} onBack={() => setNavScreen("subjects")} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.screenContent}
          showsVerticalScrollIndicator={false}
        >
          <StatBanner
            pct={subject.accuracy}
            status={getStrengthLabel(subject.accuracy)}
            meta={`${subject.chapters.length} topic${subject.chapters.length === 1 ? "" : "s"} in ${subject.name}`}
          />

          <Text style={styles.sectionLabel}>TOPICS</Text>
          {renderTopicRows(subject)}
        </ScrollView>
        {practiceModal}
      </SafeAreaView>
    );
  }

  // Sub-topics screen — every sub-topic is practisable (play button), plus a
  // "Practice all" bar that drills the whole topic.
  if (navScreen === "subtopics" && selectedChapter && selectedSubject) {
    const subject = selectedSubject;
    const topic = selectedChapter;
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <BackHeader
          title={topic.name}
          onBack={() => setNavScreen(displaySubjects ? "topics" : "subjects")}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.screenContent}
          showsVerticalScrollIndicator={false}
        >
          <StatBanner
            pct={topic.accuracy}
            status={getStrengthLabel(topic.accuracy)}
            meta={subject.name}
          />

          <Text style={styles.sectionLabel}>SUB-TOPICS</Text>
          <View style={styles.listCard}>
            {topic.topics.map((sub, idx) => {
              const isLast = idx === topic.topics.length - 1;
              const meta = sub.questionCount
                ? `${sub.questionCount} questions · ${sub.accuracy ?? 0}%`
                : `${getStrengthLabel(sub.accuracy)} · ${sub.accuracy ?? 0}%`;
              return (
                <TouchableOpacity
                  key={sub.id || sub.name + idx}
                  style={[styles.listRow, isLast && styles.listRowLast]}
                  activeOpacity={0.7}
                  onPress={() => openPractice(subToChapter(sub, subject))}
                >
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{sub.name}</Text>
                    <Text style={styles.listMeta}>{meta}</Text>
                  </View>
                  <View style={[styles.square, { backgroundColor: squareColor(sub.accuracy) }]} />
                  <PlayButton />
                </TouchableOpacity>
              );
            })}
          </View>

          <PracticeAllBar
            label="Practice all"
            onPress={() => openPractice(topicAllChapter(topic, subject))}
          />
        </ScrollView>
        {practiceModal}
      </SafeAreaView>
    );
  }

  // Subjects screen — the syllabus root.
  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={onHeaderScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => activeExamId != null && loadSubjects(Number(activeExamId), true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Syllabus</Text>
          <Text style={styles.pageSubtitle}>
            Adaptive map — weakest areas first. Tap a{" "}
            {displaySubjects ? "subject" : "topic"} to drill in.
            {examName ? ` · ${examName}` : ""}
          </Text>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              Loading {displaySubjects ? "subjects" : "topics"}...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="wifi-outline" size={40} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => activeExamId != null && loadSubjects(Number(activeExamId))}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !displaySubjects ? (
          // Subjects hidden (display_subject = false): the syllabus root is the
          // topics list itself — there's a single synthetic subject holding them.
          <View style={styles.screenContent}>
            {subjectGroups[0] && subjectGroups[0].chapters.length > 0 ? (
              renderTopicRows(subjectGroups[0])
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No topics found</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.cardList}>
            {subjectGroups.map((subject, idx) => (
              <TouchableOpacity
                key={subject.id || subject.name + idx}
                style={styles.subjectCard}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedChapter(null);
                  setSelectedSubject(subject);
                  setNavScreen("topics");
                }}
              >
                <AccuracyRing pct={subject.accuracy} size={48} stroke={5} fontSize={14} />
                <View style={styles.nodeInfo}>
                  <View style={styles.subjectNameRow}>
                    <Text style={{ fontSize: 18 }}>{subjectEmoji(subject.name)}</Text>
                    <Text style={styles.subjectName}>{subject.name}</Text>
                  </View>
                  <Text style={styles.subjectMeta}>
                    {subject.topicCount} topic{subject.topicCount === 1 ? "" : "s"} ·{" "}
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

      {practiceModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F8FC" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#F7F8FC",
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

  // Subject card
  subjectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  subjectNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  subjectName: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  subjectMeta: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },

  nodeInfo: { flex: 1 },

  // Drill-down header
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#F7F8FC",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 15, fontWeight: "600", color: ACCENT },
  bigTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
    backgroundColor: "#F7F8FC",
  },
  screenContent: { paddingHorizontal: 16, paddingBottom: 32 },

  // Stat banner
  banner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerInfo: { flex: 1 },
  bannerStatus: { fontSize: 17, fontWeight: "800", color: "#1A1A2E" },
  bannerMeta: { fontSize: 13, color: "#9CA3AF", marginTop: 3 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#AAAAAA",
    letterSpacing: 1,
    paddingHorizontal: 4,
    marginTop: 22,
    marginBottom: 8,
  },

  // List card (topics / sub-topics)
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listRowLast: { borderBottomWidth: 0 },
  listInfo: { flex: 1 },
  listName: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  listMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 3 },
  square: { width: 26, height: 26, borderRadius: 8 },

  // Leaf-row play button
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },

  // Practice-all bar
  practiceAllBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginTop: 16,
  },
  practiceAllIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  practiceAllLabel: { flex: 1, fontSize: 15, fontWeight: "700", color: "#fff" },

  // States
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
