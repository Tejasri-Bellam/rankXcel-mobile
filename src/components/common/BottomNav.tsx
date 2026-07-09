import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { COLORS } from "@/src/styles/styles";

type TabItem = {
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabItem[] = [
  { label: "Home", route: "/dashboard", icon: "home-outline", iconActive: "home" },
  { label: "Syllabus", route: "/practice", icon: "list-outline", iconActive: "list" },
  {
    label: "Mocks",
    route: "/mock-library",
    icon: "document-text-outline",
    iconActive: "document-text",
  },
  { label: "Live", route: "/assessments", icon: "radio-outline", iconActive: "radio" },
  {
    label: "Stats",
    route: "/analytics",
    icon: "stats-chart-outline",
    iconActive: "stats-chart",
  },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active =
          pathname === tab.route || pathname.startsWith(tab.route + "/");
        const color = active ? COLORS.primary : COLORS.textLight;
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => {
              // Replace (not push) so switching tabs never stacks history — the
              // back button should not cycle through every previously visited tab.
              if (!active) router.replace(tab.route as any);
            }}
          >
            <Ionicons
              name={active ? tab.iconActive : tab.icon}
              size={22}
              color={color}
            />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles: any = {
  bar: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 6,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
};
