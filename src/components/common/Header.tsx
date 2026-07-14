import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from "@/src/styles/styles";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getMeService } from '@/src/libs/services/profile';
import { useHeaderScroll } from '@/src/libs/context/HeaderScrollContext';
import { getAlertsUnreadCountService, getAlertsService } from '@/src/libs/services/alerts';

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
  const [unreadCount, setUnreadCount] = useState(0);
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
      // Handle either { data: { unread_count } } or { unread_count } directly,
      // depending on how genericGet unwraps the response.
      const count = res?.data?.unread_count ?? res?.unread_count;

      if (typeof count === "number") {
        setUnreadCount(count);
        return;
      }

      // Fallback: unread-count endpoint didn't return a usable number —
      // derive it from the full alerts list instead.
      await fetchUnreadCountFallback();
    } catch {
      await fetchUnreadCountFallback();
    }
  };

  const fetchUnreadCountFallback = async () => {
    try {
      const res: any = await getAlertsService();
      const payload = res?.data ?? res;
      const list = Array.isArray(payload) ? payload : payload?.results ?? [];
      const hasReadField = list.length > 0 && typeof list[0]?.is_read === "boolean";
      const count = hasReadField
        ? list.filter((a: any) => !a.is_read).length
        : list.length;
      setUnreadCount(count);
    } catch {
      // non-fatal — badge stays hidden
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
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
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
  notifBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  notifBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
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