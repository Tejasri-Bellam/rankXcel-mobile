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
  ChapterItem,
  AccuracyRing,
  getAccuracyColor,
  getStrengthLabel,
} from "./PracticeScreen";

interface Props {
  chapter: ChapterItem;
  onBack: () => void;
  onSubTopicPress: (chapter: ChapterItem) => void;
}

const getDotColor = (accuracy: number | null): string => {
  if (accuracy === null) return "#D1D5DB";
  return getAccuracyColor(accuracy);
};

export default function SubTopicsScreen({ chapter, onBack, onSubTopicPress }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#3B7DF8" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.pageTitle}>{chapter.name}</Text>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Banner */}
        <View style={styles.banner}>
          <AccuracyRing pct={chapter.accuracy} size={68} stroke={6} fontSize={14} showPercent />
          <View>
            <Text style={styles.bannerStatus}>{getStrengthLabel(chapter.accuracy)}</Text>
            <Text style={styles.bannerMeta}>{chapter.subjectName}</Text>
          </View>
        </View>

        {/* Sub-Topics list label */}
        <Text style={styles.sectionLabel}>SUB-TOPICS</Text>

        {/* Sub-topic rows — each sub-topic taps into the practice detail */}
        <View style={styles.topicWrap}>
          {chapter.topics.length > 0 ? (
            chapter.topics.map((topic, idx) => {
              const dotColor = getDotColor(topic.accuracy);
              const isLast = idx === chapter.topics.length - 1;
              const strength = getStrengthLabel(topic.accuracy);

              // Build a chapter-like object for the sub-topic drill
              const subChapter: ChapterItem = {
  id: topic.id,
  name: topic.name,
  topics: [],
  accuracy: topic.accuracy,
  subjectName: chapter.subjectName,
};

              return (
                <TouchableOpacity
                  key={topic.name + idx}
                  style={[styles.topicRow, isLast && styles.topicRowLast]}
                  onPress={() => onSubTopicPress(subChapter)}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicInfo}>
                    <Text style={styles.topicName}>{topic.name}</Text>
                    <Text style={styles.topicMeta}>
                      {topic.questionCount ? `${topic.questionCount} questions` : "questions"} ·{" "}
                      {strength}
                    </Text>
                  </View>
                  <View style={[styles.topicDot, { backgroundColor: dotColor }]} />
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </TouchableOpacity>
              );
            })
          ) : (
            /* Fallback: if no sub-topics, treat the chapter itself as a practice item */
            <TouchableOpacity
              style={[styles.topicRow, styles.topicRowLast]}
              onPress={() => onSubTopicPress(chapter)}
              activeOpacity={0.7}
            >
              <View style={styles.topicInfo}>
                <Text style={styles.topicName}>{chapter.name}</Text>
                <Text style={styles.topicMeta}>Tap to start practice</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        </View>
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
});