// src/components/assessments/AssessmentsScreen.tsx

import { COLORS } from '@/src/styles/styles';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, StatusBar, TouchableOpacity, View, Text,
} from 'react-native';
import { FlatList, ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import { ProfileMenu } from '../common/ProfileMenu';
import { getassessmentsService } from '@/src/libs/services/assessments';
import ExamDetails from './ExamDetails';
import { assessmentsStyles as styles } from '@/src/styles/sidebar/assessmentsStyles';

type TabType = 'live' | 'upcoming' | 'completed' | 'missed';

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
  const [data, setData]               = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<TabType>('live');
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => { fetchAssessments(); }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await getassessmentsService();
      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
      setData(list);
    } catch (error: any) {
      console.log('ASSESSMENTS ERROR:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  // ── Detail view ──────────────────────────────────
  if (selectedItem) {
    return (
      <ExamDetails
        item={selectedItem}
        onBack={() => setSelectedItem(null)}
      />
    );
  }

  // ── Derived data ─────────────────────────────────
  const filteredData = data.filter((item: any) => item.student_status === tab);

  const counts: Record<TabType, number> = {
    live:      data.filter((d: any) => d.student_status === 'live').length,
    upcoming:  data.filter((d: any) => d.student_status === 'upcoming').length,
    completed: data.filter((d: any) => d.student_status === 'completed').length,
    missed:    data.filter((d: any) => d.student_status === 'missed').length,
  };

  const summary = `${counts.live} live · ${counts.upcoming} upcoming · ${counts.completed} completed`;

  const getButtonLabel = (t: TabType) => {
    switch (t) {
      case 'live':      return 'Resume';
      case 'completed': return 'Re-attempt';
      case 'missed':    return 'Retry';
      default:          return 'Start';
    }
  };

  const getButtonColor = (t: TabType) => {
    switch (t) {
      case 'live':   return COLORS.green;
      case 'missed': return COLORS.red;
      default:       return COLORS.primary;
    }
  };

  // ── Tab button component ─────────────────────────
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

  // ── Card renderer ────────────────────────────────
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
                onPress={() => setSelectedItem(item)}
              >
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

  // ── Empty state ──────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No {tab} assessments</Text>
      <Text style={styles.emptySubtitle}>
        You have no {tab} assessments right now.
      </Text>
    </View>
  );

  // ── Main render ──────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header
        onMenuPress={() => setDrawerOpen(true)}
        onProfilePress={() => setProfileOpen(true)}
      />

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

      <Sidebar visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ProfileMenu visible={profileOpen} onClose={() => setProfileOpen(false)} />
    </SafeAreaView>
  );
}