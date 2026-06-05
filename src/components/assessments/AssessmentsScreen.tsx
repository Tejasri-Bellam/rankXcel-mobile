import { COLORS } from '@/src/styles/styles';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, TouchableOpacity, View, Text, BackHandler,
} from 'react-native';
import { FlatList, ScrollView } from 'react-native-gesture-handler';
import { getassessmentsService } from '@/src/libs/services/assessments';
import ExamDetails from './ExamDetails';
import { assessmentsStyles as styles } from '@/src/styles/sidebar/assessmentsStyles';
import { useTargetExam } from '@/src/libs/context/TagretExamContext';
import { useLocalSearchParams } from 'expo-router';

type TabType = 'live' | 'upcoming' | 'completed' | 'missed';

const TAB_VALUES: TabType[] = ['live', 'upcoming', 'completed', 'missed'];

const TAB_CONFIG: Record<
  TabType,
  { label: string; dot: string; accentColor: string; accentBg: string }
> = {
  live: {
    label: 'Live Now',
    dot: COLORS.green,
    accentColor: COLORS.green,
    accentBg: COLORS.greenBg,
  },
  upcoming: {
    label: 'Upcoming',
    dot: COLORS.orange,
    accentColor: COLORS.orange,
    accentBg: COLORS.orangeBg,
  },
  completed: {
    label: 'Completed',
    dot: COLORS.gray,
    accentColor: COLORS.gray,
    accentBg: COLORS.grayBg,
  },
  missed: {
    label: 'Missed',
    dot: COLORS.red,
    accentColor: COLORS.red,
    accentBg: COLORS.redBg,
  },
};

export default function AssessmentsScreen() {
  // Optional `tab` param lets other screens deep-link into a specific tab
  // (e.g. the dashboard "Upcoming live → All" link opens the Upcoming tab).
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const initialTab: TabType = TAB_VALUES.includes(tabParam as TabType)
    ? (tabParam as TabType)
    : 'live';

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>(initialTab);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Keep the active tab in sync when the deep-link param changes.
  useEffect(() => {
    if (TAB_VALUES.includes(tabParam as TabType)) {
      setTab(tabParam as TabType);
    }
  }, [tabParam]);

  // Scope assessments to the exam selected in the header.
  const { activeExamId } = useTargetExam();


  const fetchAssessments = async () => {
    try {
      setLoading(true);
      // Scope the request to the selected target exam (?exam_id=<id>).
      const res = await getassessmentsService(activeExamId ?? undefined);
      console.log('resssss', res);

      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
      setData(list);
    } catch (error: any) {
      console.log('ASSESSMENTS ERROR:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  // Refetch whenever the selected target exam changes.
  useEffect(() => { fetchAssessments(); }, [activeExamId]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedItem) { setSelectedItem(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [selectedItem]);

  // Detail view
  if (selectedItem) {
    return (
      <ExamDetails
        item={selectedItem}
        onBack={() => setSelectedItem(null)}
      />
    );
  }

  // Derived data
  const deriveStatus = (item: any): TabType => {
    if (item.latest_attempt_status === 'SUBMITTED') return 'completed';

    const scheduled = new Date(item.scheduled_at).getTime();
    const endTime = scheduled + (item.total_duration_minutes ?? 0) * 60 * 1000;
    const now = Date.now();

    if (now < scheduled) return 'upcoming';
    if (now <= endTime) return 'live';
    return 'missed';
  };

  const matchesActiveExam = (item: any): boolean => {
    if (activeExamId == null) return true;
    const examId = item?.exam?.id;
    if (examId == null) return true;
    return String(examId) === String(activeExamId);
  };

  const dataWithStatus = data.filter(matchesActiveExam).map((item: any) => ({
    ...item,
    derived_status: deriveStatus(item),
  }));

  const filteredData = dataWithStatus.filter((item: any) => item.derived_status === tab);

  const counts: Record<TabType, number> = {
    live: dataWithStatus.filter((d: any) => d.derived_status === 'live').length,
    upcoming: dataWithStatus.filter((d: any) => d.derived_status === 'upcoming').length,
    completed: dataWithStatus.filter((d: any) => d.derived_status === 'completed').length,
    missed: dataWithStatus.filter((d: any) => d.derived_status === 'missed').length,
  };

  const summary = `${counts.live} live · ${counts.upcoming} upcoming · ${counts.completed} completed`;

  const getButtonLabel = (t: TabType) => {
    switch (t) {
      case 'live': return 'Start';
      case 'completed': return 'Re-attempt';
      case 'missed': return 'Retry';
      default: return 'Start';
    }
  };

  const getButtonColor = (t: TabType) => {
    switch (t) {
      case 'live': return COLORS.green;
      case 'missed': return COLORS.red;
      default: return COLORS.primary;
    }
  };

  // Tab button component
  const TabButton = ({ value }: { value: TabType }) => {
    const active = tab === value;
    const cfg = TAB_CONFIG[value];
    return (
      <TouchableOpacity
        style={[styles.tabBtn, active && styles.tabBtnActive]}
        onPress={() => setTab(value)}
      >
        <View style={[styles.tabDot, { backgroundColor: cfg.dot, opacity: active ? 1 : 0.5 }]} />
        <Text style={[styles.tabText, active && styles.tabTextActive]}>
          {cfg.label}
        </Text>
        {counts[value] > 0 && (
          <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
              {counts[value]}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Card renderer
  const renderCard = ({ item }: { item: any }) => {
    const cfg = TAB_CONFIG[tab];
    const isCompleted = tab === 'completed';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setSelectedItem(item)}>
      <View style={styles.card}>
      {/* Left accent bar */}
      <View style={[styles.cardAccentBar, { backgroundColor: cfg.accentColor }]} />

      <View style={styles.cardContent}>
      {/* Status badge pill */}
      <View style={[styles.badgeChip, { backgroundColor: cfg.accentBg }]}>
        <View style={[styles.badgeDot, { backgroundColor: cfg.accentColor }]} />
          <Text style={[styles.badgeText, { color: cfg.accentColor }]}>
            {cfg.label.toUpperCase()}
          </Text>
        </View>

      {/* Title */}
      <Text style={styles.cardTitle}>{item.name}</Text>

      {/* Subtitle */}
      <Text style={styles.cardDesc}>
        {item.exam?.name || item.description || ''}
      </Text>

      {/* Meta row + action button */}
        <View style={[styles.metaRow, { justifyContent: 'space-between' }]}>
        {/* Left: meta info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱</Text>
              <Text style={styles.metaText}>{item.total_duration_minutes} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📋</Text>
              <Text style={styles.metaText}>{item.question_count} Q</Text>
            </View>
      {isCompleted && (
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>📊</Text>
          <Text style={styles.metaText}>
            {item.score != null ? `${item.score} Marks` : '0 Marks'}
          </Text>
        </View>
      )}
          </View>

      {/* Right: action button */}
        <TouchableOpacity
          style={
            isCompleted
            ? styles.completedBtn
            : [styles.primaryBtn, { backgroundColor: getButtonColor(tab) }]
          }
            onPress={() => setSelectedItem(item)}>
          <Text style={isCompleted ? styles.completedBtnText : styles.primaryBtnText}>
            {getButtonLabel(tab)}
          </Text>
        </TouchableOpacity>
        </View>
      </View>
      </View>
    </TouchableOpacity>
  );
};

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No {tab} assessments</Text>
      <Text style={styles.emptySubtitle}>
        You have no {tab} assessments right now.
      </Text>
    </View>
  );

  // Main render
  return (
    <View style={styles.safeArea}>
      {/* Page title */}
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitle}>Assessments</Text>
        <Text style={styles.pageSummary}>{summary}</Text>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={{ maxHeight: 60 }}
      >
        <TabButton value="live" />
        <TabButton value="upcoming" />
        <TabButton value="completed" />
        <TabButton value="missed" />
      </ScrollView>

      {/* List */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : filteredData.length === 0 ? (
          renderEmpty()
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

    </View>
  );
}