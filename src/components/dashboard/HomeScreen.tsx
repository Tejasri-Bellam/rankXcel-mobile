import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { COLORS } from "@/src/styles/styles";

import Header from "../common/Header";
import Sidebar from "../common/Sidebar";
import { ProfileMenu } from "../common/ProfileMenu";

import Greeting from "./Greeting";
import TodaysFocus from "./TodaysFocus";
import Continue from "./Continue";
import Performance from "./Performance";
import WeakChapter from "./WeakChapter";
import Upcoming from "./Upcoming";
import { useDashboard } from "@/src/libs/hooks/enrollment/useDashboard";

export default function HomeScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <Header
        onMenuPress={() => setDrawerOpen(true)}
        onProfilePress={() => setProfileOpen(!profileOpen)}
      />

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
            <TodaysFocus dashboardData={dashboardData} />
            <Continue dashboardData={dashboardData} />
            <Performance dashboardData={dashboardData} />
            <WeakChapter dashboardData={dashboardData} />
            <Upcoming dashboardData={dashboardData} />
          </View>
        </ScrollView>
      )}

      <Sidebar visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ProfileMenu
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles: any = {
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 24 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: COLORS.textLight, fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
};
