import { assessmentsStyles } from '@/src/styles/sidebar/assessmentsStyles';
import { COLORS } from '@/src/styles/styles';
import { useEffect, useState } from 'react';
import {
  FlatList,
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
import ExamDetails from './ExamDetails';
import { getassessmentsService } from '@/src/libs/services/assessments';

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

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssessments();
      }, []);

      const fetchAssessments = async () => {
  try {
    setLoading(true);

    const res = await getassessmentsService();

    console.log("ASSESSMENTS API:", res);

    setData(res.data.results || []);
  } catch (error) {
    console.log("ASSESSMENTS ERROR:", error);
  } finally {
    setLoading(false);
  }
};

  const [tab, setTab] = useState<TabType>('live');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // ── Detail view state ──
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // ── If detail view is active ──
  if (selectedItem) {
    return (
      <ExamDetails
        item={selectedItem}
        onBack={() => setSelectedItem(null)}
      />
    );
  }

  const filteredData = data.filter(
    (item: any) => item.student_status === tab
  );

  const counts: Record<TabType, number> = {
    live: data.filter((d: any) => d.student_status === 'live').length,
    upcoming: data.filter((d: any) => d.student_status === 'upcoming').length,
    completed: data.filter((d: any) => d.student_status === 'completed').length,
    missed: data.filter((d: any) => d.student_status === 'missed').length,
  };

  const summary = `${counts.live} live · ${counts.upcoming} upcoming · ${counts.completed} completed`;

  const config = TAB_CONFIG[tab];

  const getButtonLabel = (tabValue: TabType) => {
    switch (tabValue) {
      case 'live':      return 'Resume';
      case 'completed': return 'View Details';
      case 'missed':    return 'Retry';
      default:          return 'Start';
    }
  };

  const getButtonColor = (tabValue: TabType) => {
    switch (tabValue) {
      case 'live':   return COLORS.green;
      case 'missed': return COLORS.red;
      default:       return COLORS.primary;
    }
  };

  const renderCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setSelectedItem(item)}
    >
      <View style={assessmentsStyles.card}>
        <View
          style={[
            assessmentsStyles.cardAccentBar,
            { backgroundColor: config.accentColor },
          ]}
        />

        <View style={assessmentsStyles.cardContent}>
          {/* Status badge */}
          <View
            style={[
              assessmentsStyles.badgeChip,
              { backgroundColor: config.accentBg },
            ]}
          >
            <View
              style={[
                assessmentsStyles.badgeDot,
                { backgroundColor: config.accentColor },
              ]}
            />
            <Text
              style={[
                assessmentsStyles.badgeText,
                { color: config.accentColor },
              ]}
            >
              {config.label.toUpperCase()}
            </Text>
          </View>

          {/* Title */}
          <Text style={assessmentsStyles.cardTitle}>{item.name}</Text>

          {/* Description */}
          <Text style={assessmentsStyles.cardDesc}>
            {item.description || item.exam?.name}
          </Text>

          {/* Duration + Questions meta */}
          <View style={assessmentsStyles.metaRow}>
            <Text style={assessmentsStyles.metaText}>
              {item.total_duration_minutes} min
            </Text>
            <Text style={assessmentsStyles.metaText}>
              {item.question_count} Q
            </Text>
          </View>

          {/* Window label */}
          {item.window_label && (
            <Text style={assessmentsStyles.windowText}>
              {item.window_label}
            </Text>
          )}

          {/* Footer: date + action button */}
          <View style={assessmentsStyles.cardFooter}>
            <Text style={assessmentsStyles.dateLabel}>
              {item.date_label}
            </Text>

            <TouchableOpacity
              style={[
                assessmentsStyles.primaryBtn,
                { backgroundColor: getButtonColor(tab) },
              ]}
              onPress={() => setSelectedItem(item.id + item.attempt_id)}
            >
              <Text style={assessmentsStyles.primaryBtnText}>
                {getButtonLabel(tab)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const TabButton = ({ value }: { value: TabType }) => {
    const active = tab === value;
    const cfg = TAB_CONFIG[value];

    return (
      <TouchableOpacity
        style={[
          assessmentsStyles.tabBtn,
          active && assessmentsStyles.tabBtnActive,
        ]}
        onPress={() => setTab(value)}
      >
        <View
          style={[
            assessmentsStyles.tabDot,
            { backgroundColor: cfg.dot },
          ]}
        />

        <Text
          style={[
            assessmentsStyles.tabText,
            active && assessmentsStyles.tabTextActive,
          ]}
        >
          {cfg.label}
        </Text>

        {counts[value] > 0 && (
          <View
            style={[
              assessmentsStyles.tabBadge,
              active && assessmentsStyles.tabBadgeActive,
            ]}
          >
            <Text
              style={[
                assessmentsStyles.tabBadgeText,
                active && assessmentsStyles.tabBadgeTextActive,
              ]}
            >
              {counts[value]}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={assessmentsStyles.emptyContainer}>
      <Text style={assessmentsStyles.emptyTitle}>
        No {tab} assessments
      </Text>
      <Text style={assessmentsStyles.emptySubtitle}>
        You have no {tab} assessments right now.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={assessmentsStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Header
        onMenuPress={() => setDrawerOpen(true)}
        onProfilePress={() => setProfileOpen(true)}
      />

      {/* TOP FIXED CONTENT */}
      <View>
        <View style={assessmentsStyles.pageTitleRow}>
          <Text style={assessmentsStyles.pageTitle}>Assessments</Text>
          <Text style={assessmentsStyles.pageSummary}>{summary}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={assessmentsStyles.tabsContainer}
        >
          <TabButton value="live" />
          <TabButton value="upcoming" />
          <TabButton value="completed" />
          <TabButton value="missed" />
        </ScrollView>
      </View>

      {/* FLEX CONTENT AREA */}
      <View style={{ flex: 1 }}>
        {filteredData.length === 0 ? (
          renderEmpty()
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={assessmentsStyles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Sidebar visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ProfileMenu visible={profileOpen} onClose={() => setProfileOpen(false)} />
    </SafeAreaView>
  );
}