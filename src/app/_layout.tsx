import { Stack, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { BackHandler, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Header from "@/src/components/common/Header";
import Sidebar from "@/src/components/common/Sidebar";
import { ProfileMenu } from "@/src/components/common/ProfileMenu";
import { COLORS } from "@/src/styles/styles";

const HEADER_ROUTES = [
  "/dashboard",
  "/assessments",
  "/mock-library",
  "/practice",
  "/analytics",
  "/profile",
];

function AppShell() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const showHeader = HEADER_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  useEffect(() => {
    if (!showHeader) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (drawerOpen) { setDrawerOpen(false); return true; }
      if (profileOpen) { setProfileOpen(false); return true; }
      return false;
    });
    return () => sub.remove();
  }, [drawerOpen, profileOpen, showHeader]);

  return (
    <>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: COLORS.white }}>
        {showHeader && (
          <Header
            onMenuPress={() => setDrawerOpen(true)}
            onProfilePress={() => setProfileOpen((v) => !v)}
          />
        )}
        {/* <View style={{ flex: 1, paddingBottom: insets.bottom }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View> */}
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaView>
      {showHeader && (
        <>
          <Sidebar visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
          <ProfileMenu visible={profileOpen} onClose={() => setProfileOpen(false)} />
        </>
      )}
    </>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
 