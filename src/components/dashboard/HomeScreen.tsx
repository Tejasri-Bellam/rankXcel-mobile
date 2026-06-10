import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { COLORS } from "@/src/styles/styles";
import { useHeaderScroll } from "@/src/libs/context/HeaderScrollContext";
import Greeting from "./Greeting";
import ExamReadiness from "./ExamReadiness";
import DailyGoal from "./DailyGoal";
import Streak from "./Streak";
import Continue from "./Continue";
import StrengthBySubject from "./StrengthBySubject";
import Upcoming from "./Upcoming";
import RecentActivity from "./RecentActivity";
import { useDashboard } from "@/src/libs/hooks/enrollment/useDashboard";

export default function HomeScreen() {
  const {
    user,
    targetExams,
    activeExamId,
    dashboardData,
    isLoading,
    dashboardLoading,
    error,
    refresh,
  } = useDashboard();

  const [refreshing, setRefreshing] = React.useState(false);

  // Drive the shared header's background: transparent at the top, solid once
  // the user scrolls. Reset to transparent when leaving the screen.
  const { setScrolled } = useHeaderScroll();

  React.useEffect(() => {
    return () => setScrolled(false);
  }, [setScrolled]);

  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrolled(e.nativeEvent.contentOffset.y > 8);
    },
    [setScrolled]
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const activeExam = targetExams.find(
    (e) => String(e.id) === String(activeExamId)
  );

  return (
    <View style={styles.safeArea}>
      {(isLoading || dashboardLoading) && !dashboardData ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error && !dashboardData ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          <Greeting user={user} dashboardData={dashboardData} />
          <ExamReadiness
            dashboardData={dashboardData}
            examName={activeExam?.name}
          />
          <DailyGoal dashboardData={dashboardData} />
          <Streak dashboardData={dashboardData} />
          <Continue dashboardData={dashboardData} examId={activeExamId} />
          <StrengthBySubject dashboardData={dashboardData} />
          <Upcoming dashboardData={dashboardData} />
          <RecentActivity dashboardData={dashboardData} />
        </ScrollView>
      )}
    </View>
  );
}

const styles: any = {
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 30 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: {
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
};
