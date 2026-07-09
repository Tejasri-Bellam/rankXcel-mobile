import { Stack, usePathname, useGlobalSearchParams, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Platform, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "@/src/styles/styles";
import Header from "@/src/components/common/Header";
import ProfileSidebar from "@/src/components/common/ProfileSidebar";
import BottomNav from "@/src/components/common/BottomNav";
import { TargetExamProvider } from "../libs/context/TagretExamContext";
import { HeaderScrollProvider } from "../libs/context/HeaderScrollContext";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { submitAbandonedAttempt } from "../libs/utils/examSession";

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

// The top-level tab roots (excludes /profile, which is a pushed drill-down).
// Since tabs are switched with router.replace, these have no back stack of
// their own: hardware back on any of them returns Home, and Home exits the app.
const ROOT_TAB_ROUTES = [
  "/dashboard",
  "/assessments",
  "/mock-library",
  "/practice",
  "/analytics",
];
const HOME_ROUTE = "/dashboard";

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

  // On cold launch, submit any exam attempt left in progress by a previous run
  // that was killed / swiped out of recents mid-exam (it never got to submit).
  useEffect(() => {
    submitAbandonedAttempt();
  }, []);

  // Keep the latest values in a ref so the hardware-back handler can be
  // registered exactly ONCE (on mount). If it re-registered on every
  // pathname/view change it would jump to the front of the back-press queue and
  // fire before the screen-level handlers (mock detail, exam, syllabus), which
  // would send the user Home instead of back to the current tab's list.
  const backStateRef = useRef({ profileOpen, pathname, view });
  backStateRef.current = { profileOpen, pathname, view };

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      const { profileOpen, pathname, view } = backStateRef.current;
      if (profileOpen) {
        setProfileOpen(false);
        return true;
      }
      // Any in-screen sub-view (mock detail/results/solutions, live exam)
      // publishes a `view` param and owns its own back handling — let it return
      // to its parent list rather than jumping Home from here.
      if (view) return false;

      const isRootTab = ROOT_TAB_ROUTES.some(
        (r) => pathname === r || pathname.startsWith(r + "/")
      );
      if (isRootTab) {
        // On a tab other than Home → go Home. On Home → exit the app.
        if (pathname === HOME_ROUTE || pathname.startsWith(HOME_ROUTE + "/")) {
          if (Platform.OS === "android") BackHandler.exitApp();
          return true;
        }
        router.replace(HOME_ROUTE);
        return true;
      }
      // Drill-down routes (pushed) fall through to the default pop behaviour.
      return false;
    });
    return () => sub.remove();
    // Registered once — reads live state via backStateRef.
  }, []);

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
