import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { COLORS } from "@/src/styles/styles";
import TodaysFocus from "./TodaysFocus";
import Continue from "./Continue";
import Performance from "./Performance";
import WeakChapter from "./WeakChapter";
import Upcoming from "./Upcoming";
import { useDashboard } from "@/src/libs/hooks/enrollment/useDashboard";
import Greeting from "./Greeting";

export default function HomeScreen() {
  const router = useRouter();

  const {
    user,
    activeExamId,
    dashboardData,
    isLoading,
    error,
    refresh,
  } = useDashboard();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return (
    <View style={styles.safeArea}>
      {isLoading && !dashboardData ? (
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.greetingSection}>
            <Greeting user={user} />
            <TodaysFocus dashboardData={dashboardData} examId={activeExamId} />
            <Continue dashboardData={dashboardData} />
            <Performance dashboardData={dashboardData} />
            <WeakChapter dashboardData={dashboardData} />
            <Upcoming dashboardData={dashboardData} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles: any = {
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 30 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: COLORS.textLight, fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
};