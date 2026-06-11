import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  SubjectGroup,
  ChapterItem,
  AccuracyRing,
  getAccuracyColor,
  getStrengthLabel,
} from "./PracticeScreen";

interface Props {
  subject: SubjectGroup;
  onBack: () => void;
  onTopicPress: (chapter: ChapterItem) => void;
  onAllTopicsPress: () => void;
}

const getDotColor = (accuracy: number | null): string => {
  if (accuracy === null) return "#D1D5DB";
  return getAccuracyColor(accuracy);
};

export default function TopicsScreen({ subject, onBack, onTopicPress, onAllTopicsPress }: Props) {
  const hasTopics = subject.chapters.length > 0;
  // "All topics at once" only applies to flat subjects — every topic is a leaf
  // (no sub-topics). Subjects with sub-topics are drilled into per topic.
  const isFlat = hasTopics && subject.chapters.every((c) => c.topics.length === 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#3B7DF8" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.pageTitle}>{subject.name}</Text>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerRingWrap}>
            <AccuracyRing pct={subject.accuracy} size={68} stroke={6} fontSize={14} showPercent />
          </View>
          <View>
            <Text style={styles.bannerStatus}>{getStrengthLabel(subject.accuracy)}</Text>
            <Text style={styles.bannerMeta}>
              {subject.chapters.length} topics in {subject.name}
            </Text>
          </View>
        </View>

        {!hasTopics ? (
          /* Subject with no topic tree — practise across the whole subject. */
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No topics here yet — practise across the whole subject.
            </Text>
            <TouchableOpacity
              style={styles.startWholeBtn}
              onPress={onAllTopicsPress}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.startWholeText}>Start practice</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Practise every topic at once — flat subjects only */}
            {isFlat && (
              <TouchableOpacity
                style={styles.allTopicsBtn}
                onPress={onAllTopicsPress}
                activeOpacity={0.85}
              >
                <View style={styles.allTopicsIcon}>
                  <Ionicons name="play" size={16} color="#3B7DF8" />
                </View>
                <View style={styles.allTopicsInfo}>
                  <Text style={styles.allTopicsTitle}>Practice all topics at once</Text>
                  <Text style={styles.allTopicsMeta}>
                    Mixed questions from all {subject.chapters.length} topics
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#3B7DF8" />
              </TouchableOpacity>
            )}

            {/* Topics list label */}
            <Text style={styles.sectionLabel}>TOPICS</Text>

            {/* Topics */}
            <View style={styles.topicWrap}>
              {subject.chapters.map((chapter, idx) => {
                const dotColor = getDotColor(chapter.accuracy);
                const isLast = idx === subject.chapters.length - 1;
                return (
                  <TouchableOpacity
                    key={chapter.name + idx}
                    style={[styles.topicRow, isLast && styles.topicRowLast]}
                    onPress={() => onTopicPress(chapter)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.topicInfo}>
                      <Text style={styles.topicName}>{chapter.name}</Text>
                      <Text style={styles.topicMeta}>
                        {chapter.topics.length > 0
                          ? `${chapter.topics.length} sub-topics`
                          : "questions"}{" "}
                        · {chapter.accuracy !== null ? `${chapter.accuracy}%` : "—"}
                      </Text>
                    </View>
                    <View style={[styles.topicDot, { backgroundColor: dotColor }]} />
                    <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#EEEFF5" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: "#EEEFF5",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B7DF8",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
    backgroundColor: "#EEEFF5",
  },
  banner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 20,
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
  bannerRingWrap: {},
  bannerStatus: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1A2E",
  },
  bannerMeta: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 3,
  },
  allTopicsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EEF4FF",
    borderWidth: 1.5,
    borderColor: "#C9DDFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  allTopicsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#DCE8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  allTopicsInfo: { flex: 1 },
  allTopicsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  allTopicsMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#AAAAAA",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  topicWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginHorizontal: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  topicRowLast: {
    borderBottomWidth: 0,
  },
  topicInfo: { flex: 1 },
  topicName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  topicMeta: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  topicDot: {
    width: 32,
    height: 32,
    borderRadius: 9,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  startWholeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3B7DF8",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  startWholeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});