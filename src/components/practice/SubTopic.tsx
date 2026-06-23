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
  ChapterItem,
  AccuracyRing,
  getAccuracyColor,
  getStrengthLabel,
} from "./PracticeScreen";
import { subTopicStyles as styles } from "@/src/styles/styles/practice/subtopicstyles";

interface Props {
  chapter: ChapterItem;
  loading?: boolean;
  onBack: () => void;
  onSubTopicPress: (chapter: ChapterItem) => void;
}

const getDotColor = (accuracy: number | null): string => {
  if (accuracy === null) return "#D1D5DB";
  return getAccuracyColor(accuracy);
};

export default function SubTopicsScreen({ chapter, loading, onBack, onSubTopicPress }: Props) {
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

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#3B7DF8" />
            <Text style={styles.loadingText}>Loading sub-topics...</Text>
          </View>
        ) : (
        /* Sub-topic rows — each sub-topic taps into the practice detail */
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
