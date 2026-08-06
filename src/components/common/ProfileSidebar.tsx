import React, { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/src/libs/utils/apiError";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "@/src/styles/styles";
import { CURRENCY_SYMBOLS } from "@/src/libs/constants";
import { logoutService } from "@/src/libs/services/auth";
import {
  getMeService,
  getTargetExamsService,
  deleteTargetExamService,
  getExamsListService,
} from "@/src/libs/services/profile";
import {
  getCountriesService,
  getCountryService,
  normalizeUserCountry,
  svgToDataUri,
} from "@/src/libs/services/countries";
import { storageGetAccessToken, clearUserSession } from "@/src/libs/storage";
import { useTargetExam, TargetExam } from "@/src/libs/context/TagretExamContext";
import ConfirmModal from "@/src/components/common/ConfirmModal";

const { width, height } = Dimensions.get("window");
// Full-width panel.
const PANEL_W = width;

// Height of a bottom sheet's header row — the title, the "+ Add" pill and the
// pinned close button all share it so they line up on one baseline.
const HEADER_ROW_H = 32;

// Drag past this far (or flick faster than this) and the sheet dismisses;
// anything less springs back.
const SHEET_DISMISS_DISTANCE = 110;
const SHEET_DISMISS_VELOCITY = 0.7;

/**
 * Makes a bottom sheet draggable: the handle was previously decorative, so the
 * only way out was the close button.
 *
 * Returns the transform for the sheet and the pan handlers to spread on its
 * grab area. Attach the handlers to the handle/header only — the list below
 * owns vertical gestures, and claiming them here would break scrolling.
 */
function useSheetDrag(visible: boolean, onClose: () => void) {
  const translateY = useRef(new Animated.Value(0)).current;
  // The responder is built once, so it must read the *current* onClose.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Reopening after a drag-dismiss must start from the top again.
  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        // Downward only — dragging up shouldn't lift the sheet off the bottom.
        translateY.setValue(Math.max(0, g.dy));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > SHEET_DISMISS_DISTANCE || g.vy > SHEET_DISMISS_VELOCITY) {
          Animated.timing(translateY, {
            toValue: height,
            duration: 180,
            useNativeDriver: true,
          }).start(() => onCloseRef.current());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          bounciness: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return { sheetTransform: { transform: [{ translateY }] }, panHandlers: pan.panHandlers };
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

type RegionInfo = {
  id?: number | string;
  name: string;
  code?: string;
  currency?: string;
  flagUrl?: string;
};

type Country = {
  id: number | string;
  name: string;
  code?: string;
  currency?: string;
  currencySymbol?: string;
  flagUrl?: string;
  flagship?: string;
};

// Normalize the various field names the masters/countries endpoint may use.
const normalizeCountry = (raw: any, idx: number): Country => {
  const code =
    raw?.iso_code_2 ??
    raw?.code ??
    raw?.iso ??
    raw?.iso_code ??
    raw?.country_code;
  const currency = raw?.currency ?? raw?.currency_code ?? raw?.currencyCode;
  return {
    id: raw?.id ?? raw?.value ?? code ?? idx,
    name: raw?.name ?? raw?.label ?? raw?.country ?? raw?.display_name ?? "—",
    code,
    currency: currency || undefined,
    currencySymbol:
      raw?.currency_symbol ??
      raw?.currencySymbol ??
      (currency ? CURRENCY_SYMBOLS[currency] : undefined),
    // Only the API's SVG flag is rendered as an image; everything else shows
    // the globe fallback (no emoji-from-code flags).
    flagUrl: svgToDataUri(raw?.flag),
    flagship:
      raw?.flagship_course ??
      raw?.flagship_exam ??
      raw?.flagship ??
      raw?.default_exam ??
      raw?.exam,
  };
};

// Renders the country's SVG flag from the API; falls back to a globe glyph
// when the API didn't provide one.
const Flag = ({ url, size = 24 }: { url?: string; size?: number }) => {
  if (url) {
    return (
      <ExpoImage
        source={{ uri: url }}
        style={{ width: size, height: size * 0.7, borderRadius: 3 }}
        contentFit="contain"
      />
    );
  }
  return <Text style={{ fontSize: size }}>🌐</Text>;
};

const getInitials = (name: string, email: string) => {
  const src = (name || email || "?").trim();
  const parts = src.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
};

// Runs `fn` once a dismissing Modal has actually left the screen. Android tears
// modals down synchronously, so it runs inline there.
const afterDismiss = (fn: () => void) => {
  if (Platform.OS === "ios") setTimeout(fn, 300);
  else fn();
};

export default function ProfileSidebar({ visible, onClose }: Props) {
  const router = useRouter();
  const { targetExams, activeExamId, setActiveExamId, refreshExams, reset } =
    useTargetExam();

  const [user, setUser] = useState<any>({ name: "", email: "" });
  const [region, setRegion] = useState<RegionInfo>({
    name: "India",
    currency: "INR",
  });
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  // Available exam catalogue for the selected country. null = not yet loaded.
  const [availableExamCount, setAvailableExamCount] = useState<number | null>(
    null
  );
  const [availableExamsLoading, setAvailableExamsLoading] = useState(false);

  const slideX = useRef(new Animated.Value(PANEL_W)).current;

  // Slide the panel in whenever it becomes visible.
  useEffect(() => {
    if (visible) {
      slideX.setValue(PANEL_W);
      Animated.timing(slideX, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
      loadUser();
      loadRegion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideX, {
      toValue: PANEL_W,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const loadUser = async () => {
    const token = await storageGetAccessToken();
    if (!token) {
      setUser({ name: "Guest", email: "" });
      return;
    }
    try {
      const res: any = await getMeService();
      setUser(res?.data ?? { name: "User", email: "" });
    } catch {
      const saved = await AsyncStorage.getItem("user");
      if (saved) setUser(JSON.parse(saved));
    }
  };

  const loadRegion = async () => {
    let current: RegionInfo = region;
    // Whether we already have a country the user has settled on — either the
    // initial default persisted at login or a later manual change. Once present,
    // it takes precedence and must not be overwritten by /v1/get_country/.
    let haveSelectedCountry = false;
    try {
      const saved = await AsyncStorage.getItem("region");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Older sessions persisted the flag as raw SVG markup, which isn't a
        // usable image source. Normalize it (a valid data:/http URL passes
        // through); if it can't be normalized, drop it so the catalogue
        // lookup below re-resolves a proper data URI.
        const flagUrl = svgToDataUri(parsed?.flagUrl);
        current = { ...region, ...parsed, flagUrl };
        setRegion(current);
        if (parsed?.id != null) haveSelectedCountry = true;
      }
    } catch {
      // keep default
    }

    // /v1/get_country/ is only the INITIAL default source. Use it solely when
    // there's no saved selection yet; afterwards the user's selection wins so a
    // manual change isn't reset every time the sidebar reopens.
    if (!haveSelectedCountry) {
      try {
        const countryRes: any = await getCountryService();
        const userCountry = normalizeUserCountry(countryRes?.data);
        if (userCountry) {
          current = {
            ...current,
            id: userCountry.id,
            name: userCountry.name || current.name,
            code: userCountry.isoCode2 || current.code,
          };
          setRegion(current);
          await AsyncStorage.setItem("regionCountryId", String(userCountry.id));
          // Persist so subsequent opens treat this as the established selection.
          await AsyncStorage.setItem("region", JSON.stringify(current));
        }
      } catch {
        // Non-fatal — fall back to the saved/default region.
      }
    }

    // Resolve flag/currency from the countries catalogue (get_country doesn't
    // include them). Match on id when known, else by name.
    if (!current.flagUrl) {
      try {
        const res: any = await getCountriesService();
        const payload = res?.data;
        const list: any[] = Array.isArray(payload)
          ? payload
          : payload?.results ?? payload?.data ?? payload?.countries ?? [];
        const catalogue = list.map(normalizeCountry);
        // The catalogue (/v1/masters/options/countries/) and /v1/get_country/
        // don't share an id space, so prefer the ISO code (the one key both
        // endpoints agree on), then fall back to id, then a name match.
        const match =
          (current.code
            ? catalogue.find(
                (c) =>
                  c.code?.toUpperCase() === current.code!.toUpperCase()
              )
            : undefined) ??
          (current.id != null
            ? catalogue.find((c) => String(c.id) === String(current.id))
            : undefined) ??
          (current.name
            ? catalogue.find(
                (c) => c.name.toLowerCase() === current.name.toLowerCase()
              )
            : undefined);
        if (match?.flagUrl) {
          const next: RegionInfo = {
            ...current,
            flagUrl: match.flagUrl,
            currency: current.currency || match.currency,
          };
          setRegion(next);
          AsyncStorage.setItem("region", JSON.stringify(next)).catch(() => {});
        }
      } catch {
        // Non-fatal — fall back to the globe glyph.
      }
    }
  };

  const activeExam = targetExams.find(
    (e) => String(e.id) === String(activeExamId)
  );

  // Load the available exam catalogue for a country so the courses sheet can
  // tell the user when a country simply has no target exams to assign.
  const loadAvailableExams = async (countryId?: number | string | null) => {
    setAvailableExamsLoading(true);
    try {
      const res: any = await getExamsListService(countryId);
      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
      setAvailableExamCount(list.length);
    } catch {
      // On failure assume the catalogue is unknown; keep the assign action.
      setAvailableExamCount(null);
    } finally {
      setAvailableExamsLoading(false);
    }
  };

  // Refresh the catalogue whenever the courses sheet opens for the current
  // region.
  useEffect(() => {
    if (coursesOpen) loadAvailableExams(region.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coursesOpen, region.id]);

  const handleSelectCountry = async (country: Country) => {
    const next: RegionInfo = {
      id: country.id,
      name: country.name,
      code: country.code,
      currency: country.currency,
      flagUrl: country.flagUrl,
    };
    setRegion(next);
    setRegionOpen(false);
    try {
      await AsyncStorage.setItem("region", JSON.stringify(next));
    } catch {
      // non-fatal — selection still applies for this session
    }
    // Re-fetch the target exam catalogue scoped to the chosen country
    // (GET /v1/exams/target-exams/?country={id}).
    refreshExams(country.id);
  };

  // Top-level tab routes are navigation roots: switching to them should replace
  // (no back-stack buildup). Secondary screens (/profile, /history, /set-goal)
  // are pushed so their back button returns to the tab underneath.
  const TAB_ROUTES = [
    "/dashboard",
    "/practice",
    "/mock-library",
    "/assessments",
    "/analytics",
  ];

  const go = (path: string) => {
    handleClose();
    const navigate = TAB_ROUTES.includes(path)
      ? () => router.replace(path as any)
      : () => router.push(path as any);
    setTimeout(navigate, 210);
  };

  // Remove a course (target exam). The list comes from target-exams (exam
  // ids), but DELETE keys on the target-exam record id, so resolve that first.
  const handleDeleteExam = (exam: TargetExam) => {
    Alert.alert(
      "Remove course",
      `Remove ${exam.name} from your courses?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              let deleteId: number | string = exam.id;
              try {
                const res: any = await getTargetExamsService();
                const raw = res?.data;
                const list: any[] = Array.isArray(raw)
                  ? raw
                  : raw?.results ?? [];
                const match = list.find(
                  (it: any) =>
                    String(it.exam?.id ?? it.exam_id) === String(exam.id)
                );
                if (match?.id != null) deleteId = match.id;
              } catch {
                // Fall back to the exam id if the lookup fails.
              }
              await deleteTargetExamService(deleteId);
              await refreshExams();
            } catch {
              Alert.alert("Error", "Failed to remove course.");
            }
          },
        },
      ]
    );
  };

  const confirmLogout = () => setLogoutOpen(true);

  const runLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutService();
    } catch {
      // ignore network errors on logout
    } finally {
      // Wipe all persisted user-scoped data (token, user, region, target
      // exam selection/catalogue, and per-exam/quiz caches).
      await clearUserSession();
      setLoggingOut(false);
      // iOS gives every Modal its own window. Dismissing the confirm dialog and
      // the sidebar while the route is replaced underneath them leaves one of
      // those windows on top of the landing page — invisible, but eating every
      // touch and scroll. Tear them down one step at a time, then navigate.
      setLogoutOpen(false);
      afterDismiss(() => {
        onClose();
        afterDismiss(() => {
          // Replace the route and clear the in-memory exam state in the same
          // commit, so the dashboard unmounts rather than re-rendering without
          // an active exam. Resetting any earlier blanks it while the modals are
          // still dismissing above it — on iOS that teardown is ~600ms, long
          // enough for its "No course in this region" empty state to show
          // through the closing sidebar. The reset itself is required: the
          // provider sits above the router and survives this navigation, so
          // without it the next student inherits this one's activeExamId.
          router.replace("/");
          reset();
        });
      });
    }
  };

  const Row = ({
    icon,
    iconBg,
    iconColor,
    title,
    subtitle,
    right,
    onPress,
    isLast,
  }: any) => (
    <TouchableOpacity
      style={[styles.row, isLast && { borderBottomWidth: 0 }]}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {right ?? (
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <Animated.View
        style={[styles.panel, { transform: [{ translateX: slideX }] }]}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Profile</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 28 }}
        >
          {/* Hero */}
          <TouchableOpacity
            style={styles.hero}
            activeOpacity={0.8}
            onPress={() => go("/profile")}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user?.name, user?.email)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{user?.name || "User"}</Text>
              {user?.email ? (
                <Text style={styles.heroEmail}>{user.email}</Text>
              ) : null}
              <View style={styles.heroBadges}>
                {user?.current_streak != null && (
                  <View style={[styles.chip, { backgroundColor: COLORS.redLight }]}>
                    <Ionicons name="flame" size={12} color={COLORS.red} />
                    <Text style={[styles.chipText, { color: COLORS.red }]}>
                      {user.current_streak}
                    </Text>
                  </View>
                )}
                {(user?.level != null || user?.rank_title) && (
                  <View
                    style={[styles.chip, { backgroundColor: COLORS.primaryLight }]}
                  >
                    <MaterialCommunityIcons
                      name="medal-outline"
                      size={12}
                      color={COLORS.primary}
                    />
                    <Text style={[styles.chipText, { color: COLORS.primary }]}>
                      {user?.level != null ? `Lvl ${user.level}` : user.rank_title}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textLight}
              style={{ alignSelf: "center" }}
            />
          </TouchableOpacity>

          {/* CURRENT COURSE */}
          <Text style={styles.sectionLabel}>CURRENT COURSE</Text>
          <View style={styles.card}>
            <Row
              icon={<Flag url={region.flagUrl} size={18} />}
              iconBg={COLORS.primaryLight}
              title={region.name || "Select country"}
              onPress={() => setRegionOpen(true)}
            />
            <Row
              icon={
                <Ionicons name="book-outline" size={18} color={COLORS.primary} />
              }
              iconBg={COLORS.primaryLight}
              title={activeExam?.name || "Select course"}
              subtitle={
                activeExam
                  ? activeExam.is_active
                    ? "Active"
                    : "Expired"
                  : "Tap to choose your target exam"
              }
              onPress={() => setCoursesOpen(true)}
              isLast
            />
          </View>

          {/* ACTIVITY */}
          <Text style={styles.sectionLabel}>ACTIVITY</Text>
          <View style={styles.card}>
            <Row
              icon={<Ionicons name="bar-chart-outline" size={18} color={COLORS.primary} />}
              iconBg={COLORS.primaryLight}
              title="Performance"
              onPress={() => go("/analytics")}
            />
            <Row
              icon={<Ionicons name="time-outline" size={18} color={COLORS.textMedium} />}
              iconBg={COLORS.grayBg}
              title="History"
              onPress={() => go("/history")}
            />
           <Row
              icon={<Ionicons name="notifications-outline" size={18} color={COLORS.orange} />}
              iconBg={COLORS.orangeLight}
              title="Notification Preference"
              onPress={() => go("/notifications-preference")}
              isLast
            />
          </View>

          {/* Log out */}
          <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>RankXcel · v2.0 (native)</Text>
        </ScrollView>
      </Animated.View>

      {/* Region & country sheet */}
      <CountrySheet
        visible={regionOpen}
        onClose={() => setRegionOpen(false)}
        currentRegion={region}
        onSelect={handleSelectCountry}
      />

      {/* Your courses sheet */}
      <CoursesSheet
        visible={coursesOpen}
        onClose={() => setCoursesOpen(false)}
        region={region}
        exams={targetExams}
        availableExamCount={availableExamCount}
        availableExamsLoading={availableExamsLoading}
        activeExamId={activeExamId}
        onSelectExam={(id) => {
          setActiveExamId(id);
          setCoursesOpen(false);
          // Close the sidebar and land on the dashboard for the chosen exam.
          go("/dashboard");
        }}
        onAssignExam={() => {
          setCoursesOpen(false);
          // Open the "assign target exam" flow.
          go("/set-goal");
        }}
        onDeleteExam={handleDeleteExam}
      />

      {/* Log out confirmation */}
      <ConfirmModal
        visible={logoutOpen}
        title="Log out"
        message="Are you sure you want to log out?"
        cancelLabel="Cancel"
        confirmLabel="Log out"
        confirmIcon="log-out-outline"
        destructive
        loading={loggingOut}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={runLogout}
      />
    </Modal>
  );
}

function CoursesSheet({
  visible,
  onClose,
  region,
  exams,
  availableExamCount,
  availableExamsLoading,
  activeExamId,
  onSelectExam,
  onAssignExam,
  onDeleteExam,
}: {
  visible: boolean;
  onClose: () => void;
  region: RegionInfo;
  exams: TargetExam[];
  availableExamCount: number | null;
  availableExamsLoading: boolean;
  activeExamId: number | string | null;
  onSelectExam: (id: number) => void;
  onAssignExam: () => void;
  onDeleteExam: (exam: TargetExam) => void;
}) {
  const insets = useSafeAreaInsets();
  const { sheetTransform, panHandlers } = useSheetDrag(visible, onClose);
  // Only hide the assign action when we've confirmed the country's catalogue is
  // empty. `null` means unknown (not loaded / fetch failed) — keep the action.
  const noExamsForCountry =
    !availableExamsLoading && availableExamCount === 0;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          sheetTransform,
          // Clear the device's bottom inset (gesture bar / nav bar) so the last
          // card isn't cut off by it.
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Grab area: drag anywhere on the handle or the title row to dismiss.
            The list below keeps its own vertical gestures. */}
        <View {...panHandlers}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              Your courses
            </Text>
            {!noExamsForCountry && (
              <TouchableOpacity
                style={styles.sheetAddBtn}
                onPress={onAssignExam}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={16} color={COLORS.white} />
                <Text style={styles.sheetAddText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.sheetList}
        >
          {/* Region (display only — country is changed from the main sidebar) */}
          <View style={styles.regionRow}>
            <Flag url={region.flagUrl} size={26} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.regionName}>{region.name}</Text>
              {region.currency ? (
                <Text style={styles.regionSub}>{region.currency}</Text>
              ) : null}
            </View>
          </View>

          {/* Exams */}
          {exams.length === 0 ? (
            <Text style={styles.sheetEmpty}>No courses added yet.</Text>
          ) : (
            exams.map((exam) => {
              const selected = String(exam.id) === String(activeExamId);
              const expired = exam.is_active === false;
              return (
                <TouchableOpacity
                  key={exam.id}
                  activeOpacity={expired ? 1 : 0.85}
                  disabled={expired}
                  onPress={() => !expired && onSelectExam(exam.id)}
                  style={[
                    styles.examCard,
                    selected && styles.examCardSelected,
                    expired && { opacity: 0.6 },
                  ]}
                >
                  <View style={styles.examIcon}>
                    <MaterialCommunityIcons
                      name="book-open-variant"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.examName}>{exam.name}</Text>
                    {exam.target_year ? (
                      <Text style={styles.examSub}>
                        Target year {exam.target_year}
                      </Text>
                    ) : null}
                  </View>
                  {expired ? (
                    <View style={styles.expiredBadge}>
                      <Text style={styles.expiredText}>Expired</Text>
                    </View>
                  ) : selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={COLORS.primary}
                    />
                  ) : null}
                  <TouchableOpacity
                    style={styles.examDelete}
                    onPress={() => onDeleteExam(exam)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}

          {/* Assigning is the header's "+ Add" button; all that's left down here
              is explaining when there's nothing to assign. */}
          {noExamsForCountry && (
            <View style={styles.noExamsRow}>
              <Text style={styles.noExamsText}>
                No target exams are available for {region.name}.
              </Text>
            </View>
          )}

          <View style={{ height: 4 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function CountrySheet({
  visible,
  onClose,
  currentRegion,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  currentRegion: RegionInfo;
  onSelect: (country: Country) => void;
}) {
  const insets = useSafeAreaInsets();
  const { sheetTransform, panHandlers } = useSheetDrag(visible, onClose);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await getCountriesService();
        const payload = res?.data;
        const list: any[] = Array.isArray(payload)
          ? payload
          : payload?.results ?? payload?.data ?? payload?.countries ?? [];
        if (active) setCountries(list.map(normalizeCountry));
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Couldn't load countries. Please try again."));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          sheetTransform,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
          <Ionicons name="close" size={18} color={COLORS.textMedium} />
        </TouchableOpacity>
        {/* Drag the handle or the title row to dismiss. */}
        <View {...panHandlers}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Region & country</Text>
          </View>
        </View>

        <Text style={styles.sheetSub}>
          Sets your exam catalogue, currency and live-test schedule. Changing
          region switches you to that country&apos;s flagship course.
        </Text>

        {loading ? (
          <View style={styles.sheetCenter}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : error ? (
          <Text style={styles.sheetEmpty}>{error}</Text>
        ) : countries.length === 0 ? (
          <Text style={styles.sheetEmpty}>No countries available.</Text>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={[styles.sheetList, { maxHeight: 380 }]}
          >
            {countries.map((c) => {
              const selected =
                (currentRegion.name &&
                  c.name.toLowerCase() ===
                    currentRegion.name.toLowerCase()) ||
                false;
              const meta = [c.currencySymbol, c.currency]
                .filter(Boolean)
                .join(" ");
              const sub = [meta, c.flagship].filter(Boolean).join(" · ");
              return (
                <TouchableOpacity
                  key={String(c.id)}
                  activeOpacity={0.85}
                  onPress={() => onSelect(c)}
                  style={[
                    styles.countryCard,
                    selected && styles.countryCardSelected,
                  ]}
                >
                  <Flag url={c.flagUrl} size={26} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.countryName}>{c.name}</Text>
                    {sub ? (
                      <Text style={styles.countrySub}>{sub}</Text>
                    ) : null}
                  </View>
                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={COLORS.primary}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 12 }} />
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles: any = {
  backdrop: {
    ...StyleSheetAbsolute(),
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: PANEL_W,
    backgroundColor: COLORS.background,
    paddingTop: 52,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  topTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textDark },
  closeBtn: { padding: 4 },

  hero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    gap: 14,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: "800" },
  heroName: { fontSize: 17, fontWeight: "800", color: COLORS.textDark },
  heroEmail: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  heroBadges: { flexDirection: "row", gap: 6, marginTop: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 11, fontWeight: "700" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: COLORS.textLight,
    marginTop: 22,
    marginBottom: 8,
    marginHorizontal: 22,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "600", color: COLORS.textDark },
  rowSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowRightText: { fontSize: 13, color: COLORS.textMedium, fontWeight: "600" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.redLight,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 22,
    paddingVertical: 14,
  },
  logoutText: { color: COLORS.red, fontSize: 14, fontWeight: "700" },
  version: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 16,
  },

  // Courses bottom sheet
  sheetBackdrop: {
    ...StyleSheetAbsolute(),
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // Bounded here rather than on the list, so the sheet never runs past the
    // screen — the list shrinks to whatever room is left (see `sheetList`).
    maxHeight: "88%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  // flexShrink lets the list give back space when the sheet hits its max
  // height; without it the last card is clipped by the screen edge.
  sheetList: { flexShrink: 1 },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 10,
  },
  // Title left, "+ Add" right — the full width of the sheet. The close button
  // sits in its own strip above (see `sheetClose`), so nothing is reserved for
  // it here. `marginTop` clears that strip.
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: HEADER_ROW_H,
    marginTop: 14,
    marginBottom: 14,
  },
  sheetTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  // "+ Add" — assigning a new target exam, in reach without scrolling past
  // every course.
  sheetAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: HEADER_ROW_H,
    paddingLeft: 11,
    paddingRight: 14,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  sheetAddText: { fontSize: 13, fontWeight: "700", color: COLORS.white },
  // Pinned to the sheet's top-right corner, level with the drag handle — not on
  // the title row, which the title and "+ Add" own outright.
  sheetClose: {
    position: "absolute",
    top: 8,
    right: 12,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.grayBg,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetEmpty: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: "center",
    paddingVertical: 20,
  },
  sheetSub: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 19,
    marginBottom: 16,
  },
  sheetCenter: { paddingVertical: 28, alignItems: "center" },

  // Region & country cards
  countryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: COLORS.white,
  },
  countryCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  countryFlag: { fontSize: 26 },
  countryName: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  countrySub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  regionRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  regionName: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  regionSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  examCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  examCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  examIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  examName: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  examSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  examDelete: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.redLight,
    marginLeft: 10,
  },
  expiredBadge: {
    backgroundColor: COLORS.redLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  expiredText: { fontSize: 11, fontWeight: "700", color: COLORS.red },

  // "Assign target exam" action in the courses sheet
  noExamsRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: COLORS.inputBg,
  },
  noExamsText: {
    fontSize: 13,
    color: COLORS.textMedium,
    textAlign: "center",
    lineHeight: 18,
  },
};

function StyleSheetAbsolute() {
  return { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;
}
