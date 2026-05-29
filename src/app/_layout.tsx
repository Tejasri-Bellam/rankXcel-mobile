import { router, Stack } from "expo-router";
import React from "react";
import { StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ;

export default function Layout() {
  const insets = useSafeAreaInsets();
  return(
          <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
          <View style={{  paddingBottom: insets.bottom, flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
  );
}