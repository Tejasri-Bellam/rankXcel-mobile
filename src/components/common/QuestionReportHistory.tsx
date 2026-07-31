import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { QuestionReportIssueType } from "@/src/libs/services/questionReports";

// One entry of a question's `reports` array, as returned by the review endpoints.
export interface QuestionReport {
  id: number;
  issue_type: QuestionReportIssueType | string;
  description?: string | null;
  choice_id?: number | null;
  status?: string | null;
  resolution_comment?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Same wording as the flag form's radio list, so a student sees the report
// titled exactly as they filed it.
export const ISSUE_TYPE_LABELS: Record<string, string> = {
  QUESTION_TEXT: "Issue with question text",
  CHOICE: "Issue with an answer choice",
  CORRECT_ANSWER: "Incorrect answer",
  IMAGE: "Image issue",
  OTHER: "Other",
};

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  RESOLVED: { label: "Resolved", color: "#059669", bg: "#E7F6EF", icon: "checkmark-circle" },
  DISMISSED: { label: "Dismissed", color: "#EF4444", bg: "#FEE2E2", icon: "close-circle" },
  IN_REVIEW: { label: "In review", color: "#2563EB", bg: "#EAF1FF", icon: "eye-outline" },
  PENDING: { label: "Pending", color: "#B45309", bg: "#FEF3C7", icon: "time-outline" },
};

const statusMeta = (status?: string | null) =>
  STATUS_META[String(status ?? "").toUpperCase()] ?? STATUS_META.PENDING;

// "Jul 30, 2026, 11:43 AM"
const formatStamp = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

interface Props {
  reports?: QuestionReport[] | null;
}

// The student's own flag history for a question: what they reported, when, and
// how the team resolved it. Renders nothing when they've never flagged it.
export default function QuestionReportHistory({ reports }: Props) {
  const list = Array.isArray(reports) ? reports : [];
  if (list.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Ionicons name="flag-outline" size={13} color="#6B7280" />
        <Text style={styles.headerText}>YOUR FLAG HISTORY</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{list.length}</Text>
        </View>
      </View>

      {list.map((r) => {
        const meta = statusMeta(r.status);
        const reported = formatStamp(r.created_at);
        const resolved = formatStamp(r.updated_at);
        return (
          <View key={String(r.id)} style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <View style={[styles.dot, { backgroundColor: meta.color }]} />
                <Text style={styles.itemTitle}>
                  {ISSUE_TYPE_LABELS[String(r.issue_type)] ?? String(r.issue_type)}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.icon} size={11} color={meta.color} />
                <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            </View>

            {!!reported && <Text style={styles.stamp}>Reported {reported}</Text>}

            {!!r.description?.trim() && (
              <Text style={styles.description}>{r.description.trim()}</Text>
            )}

            {!!r.resolution_comment?.trim() && (
              <View style={styles.resolutionBox}>
                <View style={styles.resolutionHeader}>
                  <Ionicons name="chatbubble-outline" size={12} color="#059669" />
                  <Text style={styles.resolutionLabel}>RESOLUTION</Text>
                  {!!resolved && <Text style={styles.resolutionStamp}>{resolved}</Text>}
                </View>
                <Text style={styles.resolutionText}>{r.resolution_comment.trim()}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0F1F4",
    gap: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: "#F0F1F4",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontSize: 10, fontWeight: "700", color: "#6B7280" },

  item: { gap: 4 },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  itemTitle: { fontSize: 13, fontWeight: "700", color: "#1A1A2E", flexShrink: 1 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  stamp: { fontSize: 11, color: "#9CA3AF", marginLeft: 14 },
  description: { fontSize: 13, color: "#4B5563", lineHeight: 19, marginLeft: 14 },
  resolutionBox: {
    marginLeft: 14,
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F7F8FC",
    borderLeftWidth: 2,
    borderLeftColor: "#22C55E",
    gap: 4,
  },
  resolutionHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  resolutionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.5,
    flex: 1,
  },
  resolutionStamp: { fontSize: 10, color: "#9CA3AF" },
  resolutionText: { fontSize: 13, color: "#4B5563", lineHeight: 19 },
});
