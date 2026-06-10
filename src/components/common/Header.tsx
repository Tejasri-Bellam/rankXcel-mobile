import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from "@/src/styles/styles";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMeService } from '@/src/libs/services/profile';
import { useHeaderScroll } from '@/src/libs/context/HeaderScrollContext';

type HeaderProps = {
  onProfilePress: () => void;
};

export default function Header({ onProfilePress }: HeaderProps) {
  const [avatarText, setAvatarText] = useState("AB");
  // Transparent over the page at the top; turns into a solid bar once the
  // screen is scrolled (set by the active screen's onScroll).
  const { scrolled } = useHeaderScroll();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res: any = await getMeService();
      const name = res?.data?.name || "";
      setAvatarText(getInitials(name));
      await AsyncStorage.setItem("user", JSON.stringify(res?.data));
    } catch {
      const savedUser = await AsyncStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setAvatarText(getInitials(parsed?.name || ""));
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "AB";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <View style={[styles.header, scrolled ? styles.headerScrolled : styles.headerTransparent]}>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
          <Ionicons
            name="notifications-outline"
            size={20}
            color={COLORS.textDark}
          />
          {/* Small red dot indicating unread notifications. */}
          <View style={styles.notifDot} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatar}
          onPress={onProfilePress}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>{avatarText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles: any = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // No left wordmark in the new design — actions sit on the right.
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  // At the top of the page the header blends into the background.
  headerTransparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  // Once scrolled it becomes a solid bar that separates from the content.
  headerScrolled: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Bell sits in its own white circle (visible even over the transparent header).
  notifBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    backgroundColor: COLORS.red,
    borderRadius: 4,
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
};
