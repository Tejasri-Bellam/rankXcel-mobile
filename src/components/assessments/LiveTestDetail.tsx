import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { assessmentStartService } from "@/src/libs/services/assessments-attempts";
import {
  reattemptAssessmentService,
  registerAssessmentService,
} from "@/src/libs/services/assessments";
import ExamNavigator from "./ExamNavigator";
import ExamResults from "./ExamResults";
import SolutionViewer from "./SolutionViewer";
import Leaderboard from "./Leaderboard";
import { liveTestDetailStyles as s } from "@/src/styles/styles/assessments/livetestdetailstyles";
import { LiveStatus, LIVE_STATUS_META } from "@/src/libs/constants";

export type { LiveStatus };

interface Props {
  item: any;
  status: LiveStatus;
  onBack: () => void;
}

type View_ = "detail" | "leaderboard" | "exam" | "results" | "solutions";

// "2026-06-14T19:00:00Z" → "Sun 14 Jun, 7:00 PM"
const formatWhen = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatCount = (n: number) => n.toLocaleString("en-US");

export default function LiveTestDetail({ item, status, onBack }: Props) {
  const meta = LIVE_STATUS_META[status];
  const assessmentId: number = item?.id;

  // The scheduled test window: results — and the leaderboard — only become
  // meaningful once it has fully elapsed. A submitted attempt before then is
  // "Completed", not "Results out". (No schedule info → treat as ended.)
  const examStart = new Date(item?.scheduled_at).getTime();
  const examEnded = isNaN(examStart)
    ? true
    : Date.now() >= examStart + (item?.total_duration_minutes ?? 0) * 60 * 1000;

  // Show "Completed" while the window is still open; only flip to the
  // results-out pill once the exam has actually ended.
  const displayMeta =
    status === "results" && !examEnded
      ? { label: "Completed", color: "#2563EB", bg: "#EAF1FF", live: false }
      : meta;

  const [view, setView] = useState<View_>("detail");
  const [attemptId, setAttemptId] = useState<number>(item?.latest_attempt_id);
  const [submittedAnswers, setSubmittedAnswers] = useState<
    Record<string, string[]>
  >({});
  const [timeTaken, setTimeTaken] = useState(0);
  const [loading, setLoading] = useState(false);

  // Seeded from the list's `is_registered`; flipped on a successful register.
  const [registered, setRegistered] = useState<boolean>(
    Boolean(item?.is_registered)
  );
  const [registering, setRegistering] = useState(false);

  // Real field if the list provides it; otherwise a placeholder so the card
  // matches the design. (No participant-count API yet — see backend list.)
  // Kept in state so a successful register reflects immediately, without
  // waiting for the list to refetch.
  const [participants, setParticipants] = useState<number>(
    item?.participant_count ??
      item?.registered_count ??
      item?.participants_count ??
      0
  );

  const handleRegister = async () => {
    if (registering || registered) return;
    try {
      setRegistering(true);
      await registerAssessmentService(assessmentId);
      setRegistered(true);
      // Reflect this registration in the displayed count right away.
      setParticipants((c) => c + 1);
    } catch (err: any) {
      // Already-registered responses still mean "registered".
      const code = err?.body?.code ?? err?.errors?.code?.[0];
      if (code === "ALREADY_REGISTERED") {
        setRegistered(true);
      } else {
        Alert.alert(
          "Error",
          err?.body?.error ?? err?.message ?? "Couldn't register for this test."
        );
      }
    } finally {
      setRegistering(false);
    }
  };

  const durationMinutes = item?.total_duration_minutes ?? 60;
  const questionCount = item?.question_count ?? 0;
  // A results-out test the student actually submitted (vs. missed).
  const isSubmitted = item?.latest_attempt_status === "SUBMITTED";

  // Publish the active view so the app shell can hide the global header while
  // inside the live-test flow (see HEADER hiding in app/_layout.tsx).
  React.useEffect(() => {
    router.setParams({ assessmentId: String(assessmentId), view });
    return () => {
      router.setParams({ assessmentId: undefined as any, view: undefined as any });
    };
  }, [view, assessmentId]);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (view === "solutions") {
        setView("results");
        return true;
      }
      if (view === "exam") {
        // Ongoing attempt — block hardware back. The student must submit
        // (via the X or Submit button) to leave the exam.
        return true;
      }
      if (view !== "detail") {
        setView("detail");
        return true;
      }
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [view, onBack]);

  const enterLiveTest = async (forceNew = false) => {
    let id = attemptId;
    try {
      setLoading(true);
      // No attempt yet (or a fresh re-attempt) → create one, then start.
      if (!id || forceNew) {
        const res: any = await reattemptAssessmentService(assessmentId);
        const body = res?.data ?? {};
        id =
          body?.id ?? body?.attempt_id ?? body?.latest_attempt_id ??
          body?.data?.id ?? body?.attempt?.id;
        if (!id) throw new Error("No attempt id returned");
        setAttemptId(id);
      }
      try {
        await assessmentStartService(id);
      } catch (err: any) {
        const code = err?.body?.code ?? err?.errors?.code?.[0];
        if (code !== "INVALID_STATE") throw err;
      }
      setView("exam");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.body?.error ?? err?.message ?? "Couldn't start the live test."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Sub-views ──────────────────────────────────────────────────────────────
  if (view === "leaderboard") {
    return <Leaderboard assessmentId={assessmentId} onBack={() => setView("detail")} />;
  }

  if (view === "exam") {
    return (
      <ExamNavigator
        assessmentId={assessmentId}
        attemptId={attemptId}
        durationMinutes={durationMinutes}
        onSubmit={(answers: Record<string, string[]>, seconds: number) => {
          setSubmittedAnswers(answers);
          setTimeTaken(seconds);
          setView("results");
        }}
        onBackToAssessments={onBack}
      />
    );
  }

  if (view === "results") {
    return (
      <ExamResults
        attemptId={attemptId}
        exam={item}
        answers={submittedAnswers}
        timeTakenSeconds={timeTaken}
        onBack={() => setView("detail")}
        onViewSolutions={() => setView("solutions")}
      />
    );
  }

  if (view === "solutions") {
    return (
      <SolutionViewer
        attemptId={attemptId}
        answers={submittedAnswers}
        onBack={() => setView("results")}
      />
    );
  }

  // ── Detail ───────────────────────────────────────────────────────────────
  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
  }) => (
    <View style={s.infoRow}>
      <View style={s.infoIcon}>
        <Ionicons name={icon} size={18} color='#6C63FF' />
      </View>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );

  const renderPrimary = () => {
    if (status === "live") {
      // Only registered students can enter a live test. If they never
      // registered, the window has effectively passed for them — show an inert
      // state rather than an "Enter live test" button they can't use.
      if (!registered) {
        return (
          <View style={[s.primaryBtn, s.missedBtn]}>
            <Ionicons name="time-outline" size={17} color="#9CA3AF" />
            <Text style={[s.primaryBtnText, { color: "#9CA3AF" }]}>
              Not registered
            </Text>
          </View>
        );
      }
      return (
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => enterLiveTest()}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="radio" size={17} color="#fff" />
              <Text style={s.primaryBtnText}>Enter live test</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }
    if (status === "results") {
      // Submitted → view results. Assessments aren't re-attemptable, so a missed
      // (never submitted) test just shows an inert "ended" state.
      if (isSubmitted) {
        return (
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => setView("results")}
            activeOpacity={0.85}
          >
            <Ionicons name="bar-chart" size={17} color="#fff" />
            <Text style={s.primaryBtnText}>View results</Text>
          </TouchableOpacity>
        );
      }
      return (
        <View style={[s.primaryBtn, s.missedBtn]}>
          <Ionicons name="time-outline" size={17} color="#9CA3AF" />
          <Text style={[s.primaryBtnText, { color: "#9CA3AF" }]}>Test ended</Text>
        </View>
      );
    }
    // upcoming
    if (registered) {
      return (
        <View style={[s.primaryBtn, s.registeredBtn]}>
          <Ionicons name="checkmark" size={17} color="#6C63FF" />
          <Text style={[s.primaryBtnText, { color: "#6C63FF" }]}>Registered</Text>
        </View>
      );
    }
    return (
      <TouchableOpacity
        style={[s.primaryBtn, registering && { opacity: 0.7 }]}
        onPress={handleRegister}
        disabled={registering}
        activeOpacity={0.85}
      >
        {registering ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="notifications-outline" size={17} color="#fff" />
            <Text style={s.primaryBtnText}>Register</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.safeArea}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color='#6C63FF' />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.kicker}>Live Test</Text>

        <View style={[s.statusPill, { backgroundColor: displayMeta.bg }]}>
          {displayMeta.live ? <View style={s.liveDot} /> : null}
          <Text style={[s.statusPillText, { color: displayMeta.color }]}>
            {displayMeta.label}
          </Text>
        </View>

        <Text style={s.title}>{item?.name}</Text>

        <Text style={s.description}>
          {item?.description ||
            "A simultaneous, ranked test. Everyone sits the same paper at the same time — results and your national rank publish right after."}
        </Text>

        <View style={s.infoCard}>
          <InfoRow
            icon="calendar-outline"
            label="When"
            value={status === "live" ? "Live now" : formatWhen(item?.scheduled_at)}
          />
          <View style={s.divider} />
          <InfoRow
            icon="document-text-outline"
            label="Format"
            value={`${questionCount} Qs · ${durationMinutes} min`}
          />
          <View style={s.divider} />
          <InfoRow
            icon="person-outline"
            label="Registered"
            value={formatCount(participants)}
          />
        </View>

        {renderPrimary()}

        {/* Leaderboard is only meaningful once results are out (exam ended). */}
        {examEnded && (
          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => setView("leaderboard")}
            activeOpacity={0.85}
          >
            <Ionicons name="trophy-outline" size={16} color="#1A1A2E" />
            <Text style={s.secondaryBtnText}>Leaderboard</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
