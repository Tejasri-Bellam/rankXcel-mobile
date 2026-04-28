import { practiceStyles } from '@/src/styles/sidebar/practiceStyles';
import { COLORS } from '@/src/styles/styles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../common/Header';
import { ProfileMenu } from '../common/ProfileMenu';
import Sidebar from '../common/Sidebar';
import { Chapter, ExamData, PracticeJson, Subject } from '../json/practice';
import PracticeExamFlow from './PracticeExamFlow';

const { width } = Dimensions.get('window');

// ─── Static Data ──────────────────────────────────────────────────────────────

const EXAM_DATA = PracticeJson();

const getAccuracyColor = (accuracy:number) => {
 if (accuracy >= 65) return COLORS.green;
 if (accuracy >= 40) return COLORS.orange;
 return COLORS.red;
}

// ─── Accuracy Ring ────────────────────────────────────────────────────────────
const AccuracyRing = ({ pct, color }: { pct: number; color: string }) => {
  const size = 42;
  const stroke = 3.5;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: COLORS.border,
        }}
      />
      {/* Foreground arc – approximated with a colored ring + clip */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: color,
          borderRightColor: 'transparent',
          borderBottomColor: pct > 50 ? color : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }}
      />
      <Text style={{ fontSize: 11, fontWeight: '700', color: color }}>{pct}%</Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PracticeScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState('eamcet');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Mathematics');
  const [profileOpen, setProfileOpen] = useState(false);

  // Practice flow state
  const [practiceVisible, setPracticeVisible] = useState(false);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);


  const selectedExam = EXAM_DATA.find((e) => e.id === selectedExamId)!;
  const chapters = selectedExam.chapters[selectedSubject] ?? [];

  // When switching exam, reset subject to first available
  const handleSelectExam = (exam: ExamData) => {
    setSelectedExamId(exam.id);
    setSelectedSubject(exam.subjects[0]);
  };

  const handlePracticePress = (chapter: Chapter) => {
    setActiveChapter(chapter);
    setPracticeVisible(true);
  };

  return (
    <SafeAreaView style={practiceStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
              onMenuPress={() => setDrawerOpen(true)}
              onProfilePress={() => setProfileOpen(!profileOpen)}
            />
      <ScrollView
        style={practiceStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={practiceStyles.scrollContent}
      >
        {/* ── Hero Banner ── */}
        <View style={practiceStyles.heroBanner}>
          <View style={practiceStyles.heroIconCircle}>
            <MaterialCommunityIcons name="lightning-bolt" size={28} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={practiceStyles.heroTitle}>Practice Hub</Text>
            <Text style={practiceStyles.heroSubtitle}>
              Choose an exam, pick a subject, and start practicing
            </Text>
          </View>
        </View>

        {/* ── Exam List ── */}
        <Text style={practiceStyles.sectionLabel}>YOUR TARGET EXAMS</Text>
        <View style={practiceStyles.examList}>
          {EXAM_DATA.map((exam) => {
            const isActive = exam.id === selectedExamId;
            return (
              <TouchableOpacity
                key={exam.id}
                style={[practiceStyles.examRow, isActive && practiceStyles.examRowActive]}
                onPress={() => handleSelectExam(exam)}
                activeOpacity={0.8}
              >
                <View style={[practiceStyles.examIconBox, isActive && practiceStyles.examIconBoxActive]}>
                  <MaterialCommunityIcons
                    name="book-open-outline"
                    size={20}
                    color={isActive ? COLORS.primary : COLORS.textLight}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[practiceStyles.examName, isActive && practiceStyles.examNameActive]}>
                    {exam.name}
                  </Text>
                  {exam.subtitle ? (
                    <Text style={practiceStyles.examSubtitle}>{exam.subtitle}</Text>
                  ) : null}
                </View>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Subject Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={practiceStyles.subjectTabsScroll}
          contentContainerStyle={practiceStyles.subjectTabsContent}
        >
          {selectedExam.subjects.map((subj) => (
            <TouchableOpacity
              key={subj}
              style={[
                practiceStyles.subjectTab,
                selectedSubject === subj && practiceStyles.subjectTabActive,
              ]}
              onPress={() => setSelectedSubject(subj)}
            >
              <Text
                style={[
                  practiceStyles.subjectTabText,
                  selectedSubject === subj && practiceStyles.subjectTabTextActive,
                ]}
              >
                {subj}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Chapter List ── */}
        <View style={practiceStyles.chapterList}>
          {chapters.length === 0 ? (
            <View style={practiceStyles.emptyState}>
              <MaterialCommunityIcons
                name="book-open-page-variant-outline"
                size={48}
                color={COLORS.border}
              />
              <Text style={practiceStyles.emptyText}>No chapters found for this subject</Text>
            </View>
          ) : (
                      chapters.map((chapter, index) => (
            <TouchableOpacity
              key={index}
              style={practiceStyles.chapterRow}
              activeOpacity={0.75}
              onPress={() => {
                // Future: router.push to chapter detail
              }}
            >
              <View style={practiceStyles.chapterLeft}>
                <View style={practiceStyles.chapterExpandIcon}>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={COLORS.textLight}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={practiceStyles.chapterName}>{chapter.name}</Text>

                  <Text style={practiceStyles.chapterTopics}>
                    {chapter.topics} {chapter.topics === 1 ? 'topic' : 'topics'}
                  </Text>
                </View>
              </View>

              <View style={practiceStyles.chapterRight}>
                {chapter.accuracy !== null ? (
                  <AccuracyRing
                    pct={chapter.accuracy}
                    color={getAccuracyColor(chapter.accuracy)}
                  />
                ) : (
                  <View style={practiceStyles.noDataRing}>
                    <Text style={practiceStyles.noDataText}>—</Text>
                  </View>
                )}

                <TouchableOpacity style={practiceStyles.practiceIconBtn}
                onPress={() => handlePracticePress(chapter)}>
                  <Ionicons
                    name="settings-outline"
                    size={18}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
          )}
        </View>
      </ScrollView>

      {activeChapter && (
        <PracticeExamFlow
          visible={practiceVisible}
          chapterName={activeChapter.name}
          subject={selectedSubject}
          accuracy={activeChapter.accuracy}
          onClose={() => {
            setPracticeVisible(false);
            setActiveChapter(null);
          }}
        />
      )}

      <Sidebar
         visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ProfileMenu
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

    </SafeAreaView>
  );
}
