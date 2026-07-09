import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { COLORS } from "@/src/styles/styles";
import { getNotificationPreferencesService, NotificationPreferences, updateNotificationPreferencesService } from "@/src/libs/services/alerts-preferences";

type PrefKey = keyof NotificationPreferences;

const PREF_ITEMS: { key: PrefKey; title: string; subtitle: string }[] = [
  {
    key: "streak_reminders",
    title: "Streak reminders",
    subtitle: "Don't break your daily streak",
  },
  {
    key: "live_exam_alerts",
    title: "Live exam alerts",
    subtitle: "When ranked exams open & close",
  },
  {
    key: "practice_nudges",
    title: "Practice nudges",
    subtitle: "Suggested weak topics to revise",
  },
  {
    key: "result_published",
    title: "Result published",
    subtitle: "When live exam ranks are out",
  },
  {
    key: "offers_and_news",
    title: "Offers & news",
    subtitle: "Occasional product updates",
  },
];

// Sensible defaults shown while the real preferences load / if the fetch fails.
const DEFAULT_PREFS: NotificationPreferences = {
  streak_reminders: true,
  live_exam_alerts: true,
  practice_nudges: true,
  result_published: true,
  offers_and_news: false,
};

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    setLoading(true);
    try {
      const res: any = await getNotificationPreferencesService();
      const data = res?.data;
      if (data) setPrefs((prev) => ({ ...prev, ...data }));
    } catch {
      // Non-fatal — defaults stay, toggles still work optimistically.
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: PrefKey, value: boolean) => {
    const previous = prefs;
    // Optimistic update. On failure, revert the local value directly —
    // do NOT re-fetch from the server in the catch block (that pattern
    // caused the revert bug on the notifications bell screen).
    setPrefs((p) => ({ ...p, [key]: value }));
    try {
      await updateNotificationPreferencesService({ [key]: value });
    } catch {
      setPrefs(previous);
      Alert.alert("Error", "Couldn't update this preference. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Notification Preferences</Text>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {PREF_ITEMS.map((item) => (
            <View key={item.key} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.subtitle}</Text>
              </View>
              <Switch
                value={prefs[item.key]}
                onValueChange={(val) => handleToggle(item.key, val)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 3,
  },
});