import { Stack, usePathname, useGlobalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { BackHandler, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "@/src/styles/styles";
import Header from "@/src/components/common/Header";
import ProfileSidebar from "@/src/components/common/ProfileSidebar";
import BottomNav from "@/src/components/common/BottomNav";
import { TargetExamProvider } from "../libs/context/TagretExamContext";
import { HeaderScrollProvider } from "../libs/context/HeaderScrollContext";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

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
  const { view } = useGlobalSearchParams<{ view?: string }>();
  const [profileOpen, setProfileOpen] = useState(false);

  const matches = (routes: string[]) =>
    routes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  // Hide the global app header while inside a mock (detail/exam/results/
  // solutions all render their own header inside the /mock-library route and
  // publish the active screen via the `view` param).
  const inExamFlow =
    view === "detail" ||
    view === "exam" ||
    view === "results" ||
    view === "solutions" ||
    view === "leaderboard";

  const showHeader = matches(HEADER_ROUTES) && !inExamFlow;
  // Hide the bottom tab bar while actually sitting the exam — it would
  // otherwise stack on top of the exam's own Prev/Next/Submit bar.
  const showTabs = matches(TAB_ROUTES) && view !== "exam";
  const client_id = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  const ios_client_id = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const googleSigninConfigured = useRef(false);
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

  useEffect(() => {
    const configureGoogle = async () => {
      try {
        if (!googleSigninConfigured.current && client_id) {
          GoogleSignin.configure({
            webClientId: client_id,
            iosClientId: ios_client_id,
            // Required for Google Sign-In on iOS — the native iOS OAuth client
            // id. Without it GoogleSignin.signIn() throws on iOS.
            ...(ios_client_id ? { iosClientId: ios_client_id } : {}),
            offlineAccess: true,
            scopes: ["profile", "email"],
          });
          googleSigninConfigured.current = true;
        } else if (!client_id) {
          console.warn("🚨 EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID missing from .env");
        }
      } catch (error) {
        console.error("❌ GoogleSignin configure error:", error);
      }
    };

    configureGoogle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <HeaderScrollProvider>
            <SafeAreaView
              style={{ flex: 1, backgroundColor: COLORS.background }}
            >
              <AppShell />
            </SafeAreaView>
          </HeaderScrollProvider>
        </TargetExamProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
