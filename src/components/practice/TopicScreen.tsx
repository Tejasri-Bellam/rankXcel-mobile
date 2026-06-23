import React from "react";
import {
  ActivityIndicator,
  ScrollView,
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
import { topicScreenStyles as styles } from "@/src/styles/styles/practice/topicscreenstyles";

interface Props {
  subject: SubjectGroup;
  loading?: boolean;
  onBack: () => void;
  onTopicPress: (chapter: ChapterItem) => void;
  onAllTopicsPress: () => void;
}

const getDotColor = (accuracy: number | null): string => {
  if (accuracy === null) return "#D1D5DB";
  return getAccuracyColor(accuracy);
};

export default function TopicsScreen({ subject, loading, onBack, onTopicPress, onAllTopicsPress }: Props) {
  const hasTopics = subject.chapters.length > 0;
  // "All topics at once" only applies to flat subjects — every topic is a known
  // leaf (no sub-topics). Subjects with sub-topics are drilled into per topic.
  const isFlat =
    hasTopics && subject.chapters.every((c) => c.hasChildren === false);

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

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#3B7DF8" />
            <Text style={styles.loadingText}>Loading topics...</Text>
          </View>
        ) : !hasTopics ? (
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
                        {chapter.hasChildren === false
                          ? chapter.questionCount
                            ? `${chapter.questionCount} questions`
                            : "Practice"
                          : "Sub-topics"}{" "}
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
