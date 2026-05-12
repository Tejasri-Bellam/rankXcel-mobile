import { router, Stack } from "expo-router";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ;

export default function Layout() {
  return(
          <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          {/* <StatusBar style="auto" /> */}
          <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
  );
}