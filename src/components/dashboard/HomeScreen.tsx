import { ScrollView, StatusBar, View } from "react-native";
import TodaysFocus from "./TodaysFocus";
import Continue from "./Continue";
import Greeting from "./Greeting";
import Performance from "./Performance";
import Upcoming from "./Upcoming";
import WeakChapter from "./WeakChapter";
import { COLORS } from "@/src/styles/styles";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { ProfileMenu } from "../common/ProfileMenu";
import Sidebar from "../common/Sidebar";
import Header from "../common/Header";

export default function HomeScreen() {
    const [drawerOpen, setDrawerOpen] = useState(false);
      const [profileOpen, setProfileOpen] = useState(false);
    
      const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
          <Header
        onMenuPress={() => setDrawerOpen(true)}
        onProfilePress={() => setProfileOpen(!profileOpen)}
      />

          <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
    <View className="bg-white rounded-lg shadow-md p-6 mb-6">    
      <Greeting />
      <TodaysFocus /> 
      <Continue />
      <Performance />
      <WeakChapter />
      <Upcoming />
    </View>

    </ScrollView>
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

}