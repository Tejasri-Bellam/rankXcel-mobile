import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type ReviewFilter = "all" | "correct" | "incorrect" | "skipped";

export interface ReviewFilterCounts {
  all: number;
  correct: number;
  incorrect: number;
  skipped: number;
}

interface Props {
  value: ReviewFilter;
  onChange: (next: ReviewFilter) => void;
  counts: ReviewFilterCounts;
}

const TABS: { key: ReviewFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "correct", label: "Correct" },
  { key: "incorrect", label: "Incorrect" },
  { key: "skipped", label: "Skipped" },
];

// Outcome filter for the review/solutions screens. Horizontally scrollable so
// the four pills never get squeezed on narrow devices.
export default function ReviewFilterTabs({ value, onChange, counts }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {TABS.map((t) => {
        const active = t.key === value;
        return (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(t.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabText, active && styles.tabTextActive]}
              numberOfLines={1}
              // The row is a fixed-height strip; an unbounded system font scale
              // would overflow it.
              maxFontSizeMultiplier={1.2}
            >
              {t.label} ({counts[t.key]})
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// Placeholder for a filter that matches nothing, so the list never looks broken.
export function ReviewFilterEmpty({ filter }: { filter: ReviewFilter }) {
  const label =
    filter === "correct"
      ? "correct"
      : filter === "incorrect"
      ? "incorrect"
      : "skipped";
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No {label} questions.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // RN gives ScrollView `flexGrow: 1, flexShrink: 1`, so inside a column the
  // list below would squash this strip and clip the pills. Pin the height.
  scroll: { flexGrow: 0, flexShrink: 0, height: 46, marginBottom: 10 },
  row: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  tab: {
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 13, lineHeight: 18, fontWeight: "600", color: "#9CA3AF" },
  tabTextActive: { color: "#1A1A2E", fontWeight: "700" },

  empty: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 40,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, color: "#9CA3AF", fontWeight: "500" },
});
