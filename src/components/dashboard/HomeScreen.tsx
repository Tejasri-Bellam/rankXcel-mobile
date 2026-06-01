import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { COLORS } from "@/src/styles/styles";

import Greeting from "./Greeting";
import TodaysFocus from "./TodaysFocus";
import Continue from "./Continue";
import Performance from "./Performance";
import WeakChapter from "./WeakChapter";
import Upcoming from "./Upcoming";
import { useDashboard } from "@/src/libs/hooks/enrollment/useDashboard";

export default function HomeScreen() {
  const router = useRouter();

  const {
    user,
    targetExams,
    activeExamId,
    dashboardData,
    isLoading,
    error,
    setActiveExamId,
  } = useDashboard();

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
        >
          <View className="bg-white rounded-lg shadow-md p-6 mb-6">
            <Greeting
              user={user}
              targetExams={targetExams}
              activeExamId={activeExamId}
              onSelectExam={setActiveExamId}
            />
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
  scrollContent: { paddingBottom: 24 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: COLORS.textLight, fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
};