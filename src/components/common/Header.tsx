import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from "@/src/styles/styles";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getMeService } from '@/src/libs/services/profile';
import { useHeaderScroll } from '@/src/libs/context/HeaderScrollContext';
import { getAlertsUnreadCountService } from '@/src/libs/services/alerts';

type HeaderProps = {
  onProfilePress: () => void;
};

const getInitials = (name: string) => {
  if (!name) return "AB";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

let cachedAvatarText = "";

export default function Header({ onProfilePress }: HeaderProps) {
  const router = useRouter();
  const [avatarText, setAvatarText] = useState(cachedAvatarText);
  const [hasUnread, setHasUnread] = useState(false);
  const { scrolled } = useHeaderScroll();

  useEffect(() => {
    fetchUser();
    fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyInitials = (text: string) => {
    cachedAvatarText = text;
    setAvatarText(text);
  };

  const fetchUser = async () => {
    if (!cachedAvatarText) {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        if (savedUser) applyInitials(getInitials(JSON.parse(savedUser)?.name || ""));
      } catch {
        // ignore
      }
    }
    try {
      const res: any = await getMeService();
      const name = res?.data?.name || "";
      applyInitials(getInitials(name));
      await AsyncStorage.setItem("user", JSON.stringify(res?.data));
    } catch {
      // keep cached initials
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res: any = await getAlertsUnreadCountService();
      setHasUnread((res?.data?.unread_count ?? 0) > 0);
    } catch {
      // non-fatal — dot stays hidden
    }
  };

  const handleNotifPress = () => {
    router.push("/notifications" as any);
  };

  return (
    <View style={[styles.header, scrolled ? styles.headerScrolled : styles.headerTransparent]}>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.notifBtn}
          activeOpacity={0.8}
          onPress={handleNotifPress}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={COLORS.textDark}
          />
          {hasUnread && <View style={styles.notifDot} />}
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
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTransparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
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