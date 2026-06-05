import { Stack, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { BackHandler, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import Header from "@/src/components/common/Header";
import ProfileSidebar from "@/src/components/common/ProfileSidebar";
import BottomNav from "@/src/components/common/BottomNav";
import { TargetExamProvider } from "../libs/context/TagretExamContext";

const HEADER_ROUTES = [
  "/dashboard",
  "/assessments",
  "/mock-library",
  "/practice",
  "/analytics",
];

const TAB_ROUTES = [
  "/dashboard",
  "/assessments",
  "/mock-library",
  "/practice",
  "/analytics",
  "/profile",
];

function AppShell() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const matches = (routes: string[]) =>
    routes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  const showHeader = matches(HEADER_ROUTES);
  const showTabs = matches(TAB_ROUTES);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (profileOpen) {
        setProfileOpen(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [profileOpen]);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      {showHeader && (
        <Header onProfilePress={() => setProfileOpen((v) => !v)} />
      )}

      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      {showTabs && <BottomNav />}

      <ProfileSidebar
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TargetExamProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <AppShell />
          </SafeAreaView>
        </TargetExamProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
