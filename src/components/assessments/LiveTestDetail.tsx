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
  getassessmentsService,
  reattemptAssessmentService,
  registerAssessmentService,
} from "@/src/libs/services/assessments";
import ExamNavigator from "./ExamNavigator";
import ExamResults from "./ExamResults";
import SolutionViewer from "./SolutionViewer";
import Leaderboard from "./Leaderboard";
import SubmitSuccessModal from "./SubmitSuccessModal";
import { liveTestDetailStyles as s } from "@/src/styles/styles/assessments/livetestdetailstyles";
import {
  LiveStatus,
  LIVE_STATUS_META,
  SUBMITTED_STATUSES,
  mapStudentStatus,
  studentStatusMeta,
} from "@/src/libs/constants";

export type { LiveStatus };

type View_ = "detail" | "leaderboard" | "exam" | "results" | "solutions";

interface Props {
  item: any;
  status: LiveStatus;
  onBack: () => void;
  // Notification deep-link: open straight on a sub-view (e.g. "results") for a
  // specific attempt instead of the detail/register page.
  initialView?: View_;
  initialAttemptId?: number;
}

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

export default function LiveTestDetail({
  item,
  status,
  onBack,
  initialView,
  initialAttemptId,
}: Props) {
  const meta = LIVE_STATUS_META[status];
  const assessmentId: number = item?.id;

  // The scheduled test window: results — and the leaderboard — only become
  // meaningful once it has fully elapsed. A submitted attempt before then is
  // "Completed", not "Results out". (No schedule info → treat as ended.)
  const examStart = new Date(item?.scheduled_at).getTime();
  const examEnded = isNaN(examStart)
    ? true
    : Date.now() >= examStart + (item?.total_duration_minutes ?? 0) * 60 * 1000;

  // Results (and the leaderboard) are gated on the backend's explicit
  // `is_results_published` flag — the authoritative "results have been published"
  // signal — rather than inferring it from the schedule having elapsed.
  const resultsOut = item?.is_results_published === true;

  // Status pill driven by the student's ACTUAL status (not the static
  // schedule-derived live/upcoming/results label). A submitted attempt reads
  // "Completed" until results publish, then "Results Out".
  const rawStatus = String(item?.student_status ?? "").toLowerCase();
  const statusPillMeta = SUBMITTED_STATUSES.has(rawStatus)
    ? resultsOut
      ? { label: "Results Out", color: "#059669", bg: "#E7F6EF" }
      : { label: "Completed", color: "#2563EB", bg: "#EAF1FF" }
    : studentStatusMeta(item?.student_status) ?? {
        label: meta.label,
        color: meta.color,
        bg: meta.bg,
      };
  // A live dot only while genuinely live (and results not yet out).
  const statusIsLive = mapStudentStatus(rawStatus) === "live" && !resultsOut;

  // Retained for the leaderboard header label passed down below.
  const displayMeta =
    status === "results" && !examEnded
      ? { label: "Completed", color: "#2563EB", bg: "#EAF1FF", live: false }
      : meta;

  // Never deep-link into "exam" — sitting the test must go through the detail
  // page's enter flow (which starts/fetches the attempt properly).
  const rootView: View_ =
    initialView && initialView !== "exam" ? initialView : "detail";
  // When deep-linked straight to a sub-view (e.g. "results" from a
  // notification), that sub-view is the ROOT: backing out of it returns to the
  // caller (onBack → pops back to notifications/origin) instead of drilling
  // down to the detail/register page the user never came through.
  const [view, setView] = useState<View_>(rootView);
  const [attemptId, setAttemptId] = useState<number>(
    initialAttemptId ?? item?.latest_attempt_id
  );
  const [submittedAnswers, setSubmittedAnswers] = useState<
    Record<string, string[]>
  >({});
  const [timeTaken, setTimeTaken] = useState(0);
  const [loading, setLoading] = useState(false);
  // Shown after a successful submit; auto-redirects to home after a few seconds.
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  // Pull an ATTEMPT id out of the various shapes the API returns it in.
  // NB: `assessment_id` is deliberately NOT read here — the register response
  // echoes it (== the assessment id) and it is not an attempt id.
  const pickAttemptId = (obj: any): number | undefined =>
    obj == null
      ? undefined
      : obj.attempt_id ??
        obj.attemptId ??
        obj.latest_attempt_id ??
        obj.attempt?.id ??
        obj.id;

  const handleRegister = async () => {
    if (registering || registered) return;
    try {
      setRegistering(true);
      await registerAssessmentService(assessmentId);
      // Registration creates the attempt server-side but doesn't return its id
      // (the response only echoes assessment_id) — it's fetched at enter time.
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
  // An attempt that was started but not yet submitted (e.g. the student closed
  // the app mid-exam) — the CTA should read "Resume" rather than "Enter".
  const isInProgress = item?.latest_attempt_status === "IN_PROGRESS";

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
      // At the root sub-view (usually "detail", or "results" when deep-linked):
      // hand back to the caller. Otherwise drill back down to the detail page.
      if (view !== rootView) {
        setView("detail");
        return true;
      }
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [view, onBack]);

  // The register response doesn't return the attempt id — but the assessments
  // list carries it as `latest_attempt_id` once registration has created it.
  // Re-fetch the (exam-scoped) list, paging until this assessment is found, and
  // read its latest_attempt_id.
  const resolveExistingAttemptId = async (): Promise<number | undefined> => {
    const examId = item?.exam?.id;
    try {
      let page = 1;
      while (page <= 20) {
        const res: any = await getassessmentsService(examId, page);
        const raw: any = res?.data ?? res;
        const list: any[] = Array.isArray(raw) ? raw : raw?.results ?? [];
        const match = list.find(
          (a: any) => String(a?.id) === String(assessmentId),
        );
        if (match) {
          console.log(
            "LIST MATCH — assessment",
            match?.id,
            "latest_attempt_id:",
            match?.latest_attempt_id,
            "status:",
            match?.latest_attempt_status,
          );
          return match?.latest_attempt_id ?? undefined;
        }
        if (Array.isArray(raw) || !raw?.next) break;
        page++;
      }
      console.log("LIST: assessment", assessmentId, "not found in", page, "pages");
    } catch (e) {
      console.log("LIST REFETCH ERROR:", e);
    }
    return undefined;
  };

  // Registration is what creates a student's attempt, but its response only
  // echoes assessment_id — so ensure we're registered (idempotent), then read
  // the freshly-created attempt id (latest_attempt_id) from the assessments list.
  const ensureRegisteredAttemptId = async (): Promise<number | undefined> => {
    if (!registered) {
      try {
        await registerAssessmentService(assessmentId);
        console.log("REGISTER (on enter): ok");
        setRegistered(true);
      } catch (err: any) {
        const code = err?.body?.code ?? err?.errors?.code?.[0];
        console.log("REGISTER (on enter) ERROR:", JSON.stringify(err, null, 2));
        // Already registered is fine — the attempt already exists.
        if (code !== "ALREADY_REGISTERED") throw err;
        setRegistered(true);
      }
    }
    return await resolveExistingAttemptId();
  };

  const enterLiveTest = async (forceNew = false) => {
    // Prefer the freshest attempt id from the item prop (updated by the parent's
    // refetch) over the once-seeded state, which can be stale.
    let id: number | undefined = item?.latest_attempt_id ?? attemptId ?? undefined;
    try {
      setLoading(true);
      console.log("ENTER LIVE TEST — latest_attempt_id:", item?.latest_attempt_id, "state:", attemptId);

      if (forceNew) {
        // Explicit re-attempt → create a fresh attempt server-side.
        const res: any = await reattemptAssessmentService(assessmentId);
        id = pickAttemptId(res?.data ?? res);
      } else if (!id) {
        // First attempt: the attempt is created at registration. Resolve its id
        // (NOT via /reattempt/, which is only for subsequent attempts).
        id = await ensureRegisteredAttemptId();
      }

      if (!id) {
        throw new Error(
          "Couldn't find your attempt. Please register for this test and try again.",
        );
      }
      setAttemptId(id);

      // Start the attempt — unless we're resuming one that's already in progress
      // (the runner rebuilds the timer from the attempt's server clock). Start is
      // idempotent regardless: an already-started attempt returns INVALID_STATE,
      // which we treat as "already started" and continue.
      if (!isInProgress || forceNew) {
        console.log("STARTING attempt via Start API, attempt id:", id);
        try {
          await assessmentStartService(id);
        } catch (err: any) {
          const code = err?.body?.code ?? err?.errors?.code?.[0];
          if (code !== "INVALID_STATE") throw err;
        }
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
    return(
    <Leaderboard
    assessmentId={assessmentId}
    onBack={() => setView("detail")} 
    assessmentName={item?.name}
      liveLabel={displayMeta.label}
      />
  );
  }

  if (view === "exam") {
    return (
      <>
        <ExamNavigator
          assessmentId={assessmentId}
          attemptId={attemptId}
          durationMinutes={durationMinutes}
          // Live tests close at scheduled_at + duration for everyone — a late
          // joiner only gets the remaining window (see examEnded / examStart).
          scheduledEndMs={
            isNaN(examStart)
              ? null
              : examStart + durationMinutes * 60 * 1000
          }
          onSubmit={(answers: Record<string, string[]>, seconds: number) => {
            setSubmittedAnswers(answers);
            setTimeTaken(seconds);
            // Show the success popup; it auto-redirects home after 5s.
            setShowSuccessModal(true);
          }}
          onBackToAssessments={onBack}
        />

        <SubmitSuccessModal
          visible={showSuccessModal}
          onDone={() => {
            setShowSuccessModal(false);
            router.replace("/dashboard");
          }}
        />
      </>
    );
  }

  if (view === "results") {
    return (
      <ExamResults
        attemptId={attemptId}
        exam={item}
        answers={submittedAnswers}
        timeTakenSeconds={timeTaken}
        // If results is the deep-linked root, its back returns to the caller;
        // otherwise it drills back to the detail page.
        onBack={() => (rootView === "results" ? onBack() : setView("detail"))}
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
              <Ionicons
                name={isInProgress ? "play" : "radio"}
                size={17}
                color="#fff"
              />
              <Text style={s.primaryBtnText}>
                {isInProgress ? "Resume live test" : "Enter live test"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      );
    }
    if (status === "results") {
      // Personal results are viewable once the student has submitted AND the
      // backend has published them (is_results_published). Submitted but not yet
      // published → awaiting; a missed (never submitted) test → inert "ended".
      if (isSubmitted && resultsOut) {
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
      if (isSubmitted) {
        return (
          <View style={[s.primaryBtn, s.missedBtn]}>
            <Ionicons name="hourglass-outline" size={17} color="#9CA3AF" />
            <Text style={[s.primaryBtnText, { color: "#9CA3AF" }]}>
              Awaiting results
            </Text>
          </View>
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

        <View style={[s.statusPill, { backgroundColor: statusPillMeta.bg }]}>
          {statusIsLive ? <View style={s.liveDot} /> : null}
          <Text style={[s.statusPillText, { color: statusPillMeta.color }]}>
            {statusPillMeta.label}
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

        {/* Leaderboard shows once results are published (is_results_published). */}
        {resultsOut && (
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
