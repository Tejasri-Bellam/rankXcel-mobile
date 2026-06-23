import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "@/src/styles/styles";
import { logoutService } from "@/src/libs/services/auth";
import {
  getMeService,
  getTargetExamsService,
  deleteTargetExamService,
} from "@/src/libs/services/profile";
import {
  getCountriesService,
  getCountryService,
  normalizeUserCountry,
} from "@/src/libs/services/countries";
import { storageGetAccessToken, clearUserSession } from "@/src/libs/storage";
import { useTargetExam, TargetExam } from "@/src/libs/context/TagretExamContext";

const { width, height } = Dimensions.get("window");
// Full-width panel.
const PANEL_W = width;
// Keep the courses list scrollable without letting the sheet cover the screen.
const SHEET_LIST_MAX_H = height * 0.6;

type Props = {
  visible: boolean;
  onClose: () => void;
};

type RegionInfo = {
  id?: number | string;
  name: string;
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

// The countries API returns each flag as a raw SVG string. expo-image can
// render SVG from a base64 data URI, so turn the markup into one (no extra
// package needed). Returns undefined for empty/non-SVG values.
const svgToDataUri = (svg?: string) => {
  const s = svg?.trim();
  if (!s || !s.startsWith("<svg")) return undefined;
  try {
    // UTF-8-safe base64 (flags are ASCII, but this keeps any glyphs intact).
    const bytes = encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    );
    return `data:image/svg+xml;base64,${btoa(bytes)}`;
  } catch {
    return undefined;
  }
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  GBP: "£",
  USD: "$",
  EUR: "€",
  AUD: "A$",
  CAD: "C$",
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

export default function ProfileSidebar({ visible, onClose }: Props) {
  const router = useRouter();
  const { targetExams, activeExamId, setActiveExamId, refreshExams, reset } =
    useTargetExam();

  const [user, setUser] = useState<any>({ name: "", email: "" });
  const [region, setRegion] = useState<RegionInfo>({
    name: "India",
    currency: "INR",
  });
  const [darkMode, setDarkMode] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

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
        current = { ...region, ...parsed };
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
        // don't share an id space, so try id first and fall back to name match.
        const match =
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

  const handleSelectCountry = async (country: Country) => {
    const next: RegionInfo = {
      id: country.id,
      name: country.name,
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
    // (GET /v1/exams/my-target-exams/?country={id}).
    refreshExams(country.id);
  };

  const go = (path: string) => {
    handleClose();
    setTimeout(() => router.push(path as any), 210);
  };

  // Remove a course (target exam). The list comes from my-target-exams (exam
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

  const confirmLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutService();
          } catch {
            // ignore network errors on logout
          } finally {
            // Wipe all persisted user-scoped data (token, user, region, target
            // exam selection/catalogue, and per-exam/quiz caches)...
            await clearUserSession();
            // ...and the in-memory exam state, which the provider keeps alive
            // across logout navigation. Without both, the next student inherits
            // the previous student's activeExamId and sees their data.
            reset();
            onClose();
            router.replace("/");
          }
        },
      },
    ]);
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
          <View style={styles.hero}>
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
          </View>

          {/* CURRENT COURSE */}
          <Text style={styles.sectionLabel}>CURRENT COURSE</Text>
          <View style={styles.card}>
            <Row
              icon={<Flag url={region.flagUrl} size={18} />}
              iconBg={COLORS.primaryLight}
              title="Region"
              right={
                <View style={styles.rowRight}>
                  <Text style={styles.rowRightText}>{region.name}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.textLight}
                  />
                </View>
              }
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
            />
            <Row
              icon={
                <Ionicons name="card-outline" size={18} color={COLORS.green} />
              }
              iconBg={COLORS.greenLight}
              title="Subscription & billing"
              onPress={() =>
                Alert.alert("Coming soon", "Subscription & billing is not available yet.")
              }
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
              title="Notifications"
              onPress={() => go("/profile")}
              isLast
            />
          </View>

          {/* APP */}
          <Text style={styles.sectionLabel}>APP</Text>
          <View style={styles.card}>
            <Row
              icon={<Ionicons name="settings-outline" size={18} color={COLORS.textMedium} />}
              iconBg={COLORS.grayBg}
              title="Settings"
              subtitle="Appearance, text size, accessibility"
              onPress={() => go("/profile")}
            />
            <Row
              icon={<Ionicons name="moon-outline" size={18} color={COLORS.textDark} />}
              iconBg={COLORS.grayBg}
              title="Dark mode"
              right={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              }
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
    </Modal>
  );
}

function CoursesSheet({
  visible,
  onClose,
  region,
  exams,
  activeExamId,
  onSelectExam,
  onAssignExam,
  onDeleteExam,
}: {
  visible: boolean;
  onClose: () => void;
  region: RegionInfo;
  exams: TargetExam[];
  activeExamId: number | string | null;
  onSelectExam: (id: number) => void;
  onAssignExam: () => void;
  onDeleteExam: (exam: TargetExam) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Your courses</Text>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <Ionicons name="close" size={18} color={COLORS.textMedium} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: SHEET_LIST_MAX_H }}
        >
          {/* Region */}
          <TouchableOpacity style={styles.regionRow} activeOpacity={0.8}>
            <Flag url={region.flagUrl} size={26} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.regionName}>{region.name}</Text>
              <Text style={styles.regionSub}>
                Tap to change region
                {region.currency ? ` · ${region.currency}` : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

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
                    {exam.code ? (
                      <Text style={styles.examSub}>{exam.code}</Text>
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

          {/* Assign a new target exam */}
          <TouchableOpacity
            style={styles.assignRow}
            activeOpacity={0.85}
            onPress={onAssignExam}
          >
            <View style={styles.assignIcon}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.assignTitle}>Assign target exam</Text>
              <Text style={styles.assignSub}>Add another exam to your courses</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <View style={{ height: 12 }} />
        </ScrollView>
      </View>
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
      } catch {
        if (active) setError("Couldn't load countries. Please try again.");
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
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Region & country</Text>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <Ionicons name="close" size={18} color={COLORS.textMedium} />
          </TouchableOpacity>
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
            style={{ maxHeight: 380 }}
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
      </View>
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
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  sheetClose: {
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
  assignRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: COLORS.primaryLight,
  },
  assignIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  assignTitle: { fontSize: 15, fontWeight: "700", color: COLORS.primary },
  assignSub: { fontSize: 12, color: COLORS.textMedium, marginTop: 2 },
};

function StyleSheetAbsolute() {
  return { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;
}
