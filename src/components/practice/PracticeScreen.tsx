import { practiceStyles } from '@/src/styles/sidebar/practiceStyles';
import { COLORS } from '@/src/styles/styles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
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
import PracticeExamFlow from './PracticeExamFlow';
import {
  getMyTargetExamsOptionsService,
  getSubjectOptionsService,
  OptionItem,
} from '@/src/libs/services/mock-library';
import { getChapterPerformanceService } from '@/src/libs/services/practice';

export interface TopicItem {
  name: string;
  accuracy: number | null;
}

export interface ChapterItem {
  name: string;
  topics: TopicItem[];
  accuracy: number | null;
  subjectName: string;
}

interface SubjectGroup {
  name: string;
  chapters: ChapterItem[];
}

const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 65) return COLORS.green;
  if (accuracy >= 40) return COLORS.orange;
  return COLORS.red;
};

const toArray = (raw: unknown): any[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const r = raw as { results?: any[]; data?: any[] | { results?: any[] } };
    if (Array.isArray(r.results)) return r.results;
    if (Array.isArray(r.data)) return r.data;
    if (r.data && typeof r.data === 'object' && Array.isArray((r.data as any).results)) {
      return (r.data as { results: any[] }).results;
    }
  }
  return [];
};

const unwrap = (res: any): any =>
  res && typeof res === 'object' && 'data' in res ? (res as any).data : res;

const AccuracyRing = ({ pct, color }: { pct: number; color: string }) => {
  const size = 42;
  const stroke = 3.5;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
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

const parseAccuracy = (v: any): number | null => {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
};

// Response shape (per user): an array of
// { chapter_name, subject_name, percentage, topics: [{ topic_name, percentage }] }
const normalizePerformance = (raw: any): SubjectGroup[] => {
  const data = unwrap(raw);
  const list = toArray(data);
  const subjectMap = new Map<string, SubjectGroup>();

  list.forEach((entry: any) => {
    if (!entry || typeof entry !== 'object') return;
    const subjectName = String(entry.subject_name ?? entry.subject ?? 'Subject');
    const chapterName = String(entry.chapter_name ?? entry.chapter ?? entry.name ?? '');
    if (!chapterName) return;

    if (!subjectMap.has(subjectName)) {
      subjectMap.set(subjectName, { name: subjectName, chapters: [] });
    }
    const topicsRaw = Array.isArray(entry.topics) ? entry.topics : [];
    const topics: TopicItem[] = topicsRaw.map((t: any) => ({
      name: String(t?.topic_name ?? t?.name ?? ''),
      accuracy: parseAccuracy(t?.percentage ?? t?.accuracy),
    }));
    subjectMap.get(subjectName)!.chapters.push({
      name: chapterName,
      topics,
      accuracy: parseAccuracy(entry.percentage ?? entry.accuracy),
      subjectName,
    });
  });

  return Array.from(subjectMap.values());
};

export default function PracticeScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  const [exams, setExams] = useState<OptionItem[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<OptionItem | null>(null);

  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const [practiceVisible, setPracticeVisible] = useState(false);
  const [activeChapter, setActiveChapter] = useState<ChapterItem | null>(null);

  const loadExams = useCallback(async () => {
    try {
      setExamsLoading(true);
      const res = await getMyTargetExamsOptionsService();
      const list = toArray(unwrap(res));
      setExams(list);
      setSelectedExam((prev) => prev ?? (list.length > 0 ? list[0] : null));
    } catch (err) {
      console.log('Failed to load target exams', err);
    } finally {
      setExamsLoading(false);
    }
  }, []);

  const loadPerformance = useCallback(
    async (examId: number, isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setGroupsLoading(true);
        setError(null);

        const [perfRes, subjRes] = await Promise.all([
          getChapterPerformanceService(examId),
          getSubjectOptionsService(examId),
        ]);

        const groups = normalizePerformance(perfRes);

        // Make sure every known subject for this exam appears as a tab (even if no chapters yet)
        const subjectsList = toArray(unwrap(subjRes));
        subjectsList.forEach((s: any) => {
          const name = String(s?.name ?? s?.code ?? 'Subject');
          if (!groups.find((g) => g.name === name)) {
            groups.push({ name, chapters: [] });
          }
        });

        setSubjectGroups(groups);
        setExpandedChapters({});
        if (groups.length > 0) {
          setSelectedSubject((prev) =>
            prev && groups.find((g) => g.name === prev) ? prev : groups[0].name,
          );
        } else {
          setSelectedSubject(null);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load chapters.';
        console.log('Practice performance error:', err);
        setError(msg);
      } finally {
        setGroupsLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    if (selectedExam?.id) {
      setSelectedSubject(null);
      loadPerformance(Number(selectedExam.id));
    }
  }, [selectedExam, loadPerformance]);

  const activeSubject = useMemo(
    () => subjectGroups.find((g) => g.name === selectedSubject) ?? null,
    [subjectGroups, selectedSubject],
  );
  const chapters = activeSubject?.chapters ?? [];

  const toggleChapter = (name: string) => {
    setExpandedChapters((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handlePracticePress = (chapter: ChapterItem) => {
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => selectedExam && loadPerformance(Number(selectedExam.id), true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Hero Banner */}
        <View style={practiceStyles.heroBanner}>
          <TouchableOpacity style={practiceStyles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={COLORS.textDark} />
          </TouchableOpacity>

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

        {/* Exam List */}
        <Text style={practiceStyles.sectionLabel}>YOUR TARGET EXAMS</Text>
        {examsLoading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : exams.length === 0 ? (
          <View style={practiceStyles.emptyState}>
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={48} color={COLORS.border} />
            <Text style={practiceStyles.emptyText}>No target exams found</Text>
          </View>
        ) : (
          <View style={practiceStyles.examList}>
            {exams.map((exam) => {
              const isActive = exam.id === selectedExam?.id;
              return (
                <TouchableOpacity
                  key={String(exam.id)}
                  style={[practiceStyles.examRow, isActive && practiceStyles.examRowActive]}
                  onPress={() => setSelectedExam(exam)}
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
                    {exam.code ? (
                      <Text style={practiceStyles.examSubtitle}>{exam.code}</Text>
                    ) : null}
                  </View>
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Subject Tabs */}
        {subjectGroups.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={practiceStyles.subjectTabsScroll}
            contentContainerStyle={practiceStyles.subjectTabsContent}
          >
            {subjectGroups.map((subj) => (
              <TouchableOpacity
                key={subj.name}
                style={[
                  practiceStyles.subjectTab,
                  selectedSubject === subj.name && practiceStyles.subjectTabActive,
                ]}
                onPress={() => setSelectedSubject(subj.name)}
              >
                <Text
                  style={[
                    practiceStyles.subjectTabText,
                    selectedSubject === subj.name && practiceStyles.subjectTabTextActive,
                  ]}
                >
                  {subj.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Chapter List */}
        {groupsLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 12, color: COLORS.textLight, fontSize: 13 }}>
              Loading chapters...
            </Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 }}>
            <Ionicons name="wifi-outline" size={40} color={COLORS.red} />
            <Text style={{ color: COLORS.red, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              {error}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                paddingHorizontal: 28,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: COLORS.primary,
              }}
              onPress={() => selectedExam && loadPerformance(Number(selectedExam.id))}
            >
              <Text style={{ color: COLORS.white, fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
              chapters.map((chapter) => {
                const expanded = !!expandedChapters[chapter.name];
                const topicsCount = chapter.topics.length;
                return (
                  <View key={chapter.name}>
                    <TouchableOpacity
                      style={practiceStyles.chapterRow}
                      activeOpacity={0.75}
                      onPress={() => toggleChapter(chapter.name)}
                    >
                      <View style={practiceStyles.chapterLeft}>
                        <View style={practiceStyles.chapterExpandIcon}>
                          <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color={COLORS.textLight}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={practiceStyles.chapterName}>{chapter.name}</Text>
                          <Text style={practiceStyles.chapterTopics}>
                            {topicsCount} {topicsCount === 1 ? 'topic' : 'topics'}
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

                        <TouchableOpacity
                          style={practiceStyles.practiceIconBtn}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handlePracticePress(chapter);
                          }}
                        >
                          <Ionicons name="play-circle-outline" size={22} color={COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {expanded && chapter.topics.length > 0 && (
                      <View style={{ backgroundColor: COLORS.background, paddingLeft: 38 }}>
                        {chapter.topics.map((topic) => (
                          <View
                            key={topic.name}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingHorizontal: 14,
                              paddingVertical: 12,
                              borderBottomWidth: 1,
                              borderBottomColor: COLORS.border,
                            }}
                          >
                            <Text style={{ fontSize: 13, color: COLORS.textMedium }}>
                              {topic.name}
                            </Text>
                            {topic.accuracy !== null && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '700',
                                  color: getAccuracyColor(topic.accuracy),
                                }}
                              >
                                {topic.accuracy}%
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {activeChapter && selectedExam && (
        <PracticeExamFlow
          visible={practiceVisible}
          chapter={activeChapter}
          examId={Number(selectedExam.id)}
          onClose={() => {
            setPracticeVisible(false);
            setActiveChapter(null);
            if (selectedExam) loadPerformance(Number(selectedExam.id), true);
          }}
        />
      )}

      <Sidebar visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ProfileMenu visible={profileOpen} onClose={() => setProfileOpen(false)} />
    </SafeAreaView>
  );
}
