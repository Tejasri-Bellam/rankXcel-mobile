import { useTargetExam } from "@/src/libs/context/TagretExamContext";
import { useHeaderScrollHandler } from "@/src/libs/context/HeaderScrollContext";
import { getExamSyllabusService } from "@/src/libs/services/practice";
import { COLORS, getScoreColor } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PracticeExamFlow } from "./PracticeExamFlow";
import CircleProgress from "@/src/components/dashboard/CircleProgress";
import { practiceScreenStyles as styles } from "@/src/styles/styles/practice/practicescreenstyles";


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

// Standard percentage scale: red <30, orange 30–39, yellow 40–59, green 60–100.
export const getAccuracyColor = getScoreColor;

// Weak → Mastered scale used by every node's progress colour.
export const SCALE_COLORS = [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green];

export const getNodeColor = (accuracy: number | null): string =>
  getScoreColor(accuracy);

export const getStrengthLabel = (accuracy: number | null): string => {
  if (accuracy === null) return "Not started";
  if (accuracy >= 65) return "Strong";
  if (accuracy >= 40) return "Building";
  return "Weak";
};

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
        <Ionicons name="chevron-back" size={14} color="#6C63FF" />
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

// Small blue play button shown on every practisable row. When the row's own tap
// starts practice (leaf topics / sub-topics) it's decorative; pass `onPress` to
// make it start practice itself (topics whose row tap drills into sub-topics).
const PlayButton = ({ onPress }: { onPress?: () => void }) =>
  onPress ? (
    <TouchableOpacity
      style={styles.playBtn}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name="play" size={15} color="#6C63FF" />
    </TouchableOpacity>
  ) : (
    <View style={styles.playBtn}>
      <Ionicons name="play" size={15} color="#6C63FF" />
    </View>
  );

// File-icon button next to the play button — starts the same node as a TEST
// (test_type "TEST"): answers are revealed only after the whole test is done.
const TestButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    style={styles.testBtn}
    onPress={onPress}
    activeOpacity={0.7}
    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
  >
    <Ionicons name="document-text-outline" size={16} color="#6C63FF" />
  </TouchableOpacity>
);

// Row-level action cluster: play (practice) + file (test).
const RowActions = ({ onTest }: { onTest: () => void }) => (
  <View style={styles.rowActions}>
    <PlayButton />
    <TestButton onPress={onTest} />
  </View>
);

// Full-width "Practice all" bar pinned below a list. The bar itself starts
// practice; the trailing file-icon button starts the same set as a test.
const PracticeAllBar = ({
  label,
  onPress,
  onTest,
}: {
  label: string;
  onPress: () => void;
  onTest: () => void;
}) => (
  <View style={styles.practiceAllBar}>
    <Text style={styles.practiceAllLabel}>{label}</Text>
    {/* Both actions sit on the right: play = practice, file = test. */}
    <TouchableOpacity
      style={styles.practiceAllActionBtn}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="play" size={16} color="#fff" />
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.practiceAllActionBtn}
      onPress={onTest}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="document-text-outline" size={17} color="#fff" />
    </TouchableOpacity>
  </View>
);

export default function PracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    chapterName?: string;
    subjectName?: string;
    topicId?: string;
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
  // Whether the active session is a TEST (file icon) vs untimed practice.
  const [activeIsTest, setActiveIsTest] = useState(false);
  const [autoQuestionCount, setAutoQuestionCount] = useState<number | undefined>(undefined);
  const [autoTimerMinutes, setAutoTimerMinutes] = useState<number | undefined>(undefined);
  const autoLaunchHandledRef = useRef(false);

  // Full syllabus tree for the active target exam
  // (GET /v1/exams/{examId}/syllabus/) — subjects → topics → subtopics.
  const loadSubjects = useCallback(async (examId: number, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
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

  // Android hardware back: walk the syllabus drill-down back one level
  // (subtopics → topics → subjects) instead of leaving the tab. Returning false
  // at the subjects root lets the app shell take over (→ Home).
  useEffect(() => {
    const onBack = () => {
      if (practiceVisible) { setPracticeVisible(false); return true; }
      if (navScreen === "subtopics") {
        setNavScreen(displaySubjects ? "topics" : "subjects");
        return true;
      }
      if (navScreen === "topics") {
        setNavScreen("subjects");
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [navScreen, displaySubjects, practiceVisible]);

  useEffect(() => {
    if (autoLaunchHandledRef.current) return;
    if (!params?.chapterName || !params?.subjectName || !params?.examId) return;
    if (activeExamId == null) return;
    autoLaunchHandledRef.current = true;
    setActiveIsTest(false);
    // A real topic id targets that specific topic; without one, an empty
    // `topicIds` tells the backend to draw from all topics under the subject.
    // Never fall back to a placeholder id of 0 — the API rejects it.
    const deepLinkTopicId = Number(params.topicId);
    const topicIds =
      Number.isFinite(deepLinkTopicId) && deepLinkTopicId > 0 ? [deepLinkTopicId] : [];
    setActiveChapter({
      id: topicIds[0] ?? 0,
      name: String(params.chapterName),
      subjectName: String(params.subjectName),
      topics: [],
      accuracy: null,
      topicIds,
    });
    const qc = Number(params.questionCount);
    const dm = Number(params.durationMinutes);
    setAutoQuestionCount(Number.isFinite(qc) && qc > 0 ? qc : undefined);
    setAutoTimerMinutes(Number.isFinite(dm) && dm > 0 ? dm : undefined);
    setPracticeVisible(true);
    router.setParams({ chapterName: undefined, subjectName: undefined, topicId: undefined, questionCount: undefined, durationMinutes: undefined, examId: undefined } as any);
  }, [params, activeExamId, router]);

  // Open the practice/test flow for any node in the tree. `isTest` starts the
  // session in TEST mode (file icon) — same flow, but answers are revealed only
  // after the whole test. `timed` starts it as a timed session.
  const openPractice = (chapter: ChapterItem, isTest = false, timed = false) => {
    setActiveChapter(chapter);
    setActiveIsTest(isTest);
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
  const handleAllTopicsPress = (subject: SubjectGroup, isTest = false) => {
    setActiveChapter({
      id: 0,
      name: subject.name ? `All ${subject.name} topics` : "All topics",
      topics: [],
      accuracy: subject.accuracy,
      subjectName: subject.name,
      topicIds: [],
    });
    setActiveIsTest(isTest);
    setPracticeVisible(true);
  };

  // Topic list card + "Practice all" bar — shared by the topics drill-down
  // screen and the subject-less syllabus root (display_subject = false). Topics
  // with sub-topics drill in; leaf topics start practice directly.
  const renderTopicRows = (subject: SubjectGroup) => {
    const hasTopics = subject.chapters.length > 0;
    return (
    <>
      {hasTopics ? (
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
              {/* Every topic row shows play + file + chevron for a consistent
                  layout. Topics with sub-topics drill in on tap and their
                  play/file act across the whole topic (all sub-topics); leaf
                  topics practise on row tap, so their chevron is decorative. */}
              <View style={styles.rowActions}>
                <PlayButton
                  onPress={
                    hasSubs
                      ? () => openPractice(topicAllChapter(topic, subject))
                      : undefined
                  }
                />
                <TestButton
                  onPress={() =>
                    openPractice(
                      hasSubs
                        ? topicAllChapter(topic, subject)
                        : topicToChapter(topic, subject),
                      true
                    )
                  }
                />
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No topics listed yet</Text>
        </View>
      )}

      {/* Always offer practice/test across the whole subject. With no topics
          listed we still send an empty `topicIds`, which the backend expands to
          every topic under the subject. */}
      <PracticeAllBar
        label={hasTopics ? "Practice all topics" : "Practice this subject"}
        onPress={() => handleAllTopicsPress(subject)}
        onTest={() => handleAllTopicsPress(subject, true)}
      />
    </>
    );
  };

  // Shared practice/test modal — reused across every screen.
  const practiceModal =
    activeChapter && activeExamId != null ? (
      <PracticeExamFlow
        visible={practiceVisible}
        chapter={activeChapter}
        examId={Number(activeExamId)}
        initialQuestionCount={autoQuestionCount}
        initialTimerMinutes={autoTimerMinutes}
        isTest={activeIsTest}
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
                  <RowActions
                    onTest={() => openPractice(subToChapter(sub, subject), true)}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <PracticeAllBar
            label="Practice all"
            onPress={() => openPractice(topicAllChapter(topic, subject))}
            onTest={() => openPractice(topicAllChapter(topic, subject), true)}
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
                <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
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
