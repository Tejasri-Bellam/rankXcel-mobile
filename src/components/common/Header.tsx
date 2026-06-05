import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from "@/src/styles/styles";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMeService } from '@/src/libs/services/profile';

type HeaderProps = {
  onProfilePress: () => void;
};

export default function Header({ onProfilePress }: HeaderProps) {
  const [avatarText, setAvatarText] = useState("AB");

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
    <View style={styles.header}>
      <Text style={styles.headerTitle}>RankXcel</Text>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons
            name="notifications-outline"
            size={22}
            color={COLORS.textDark}
          />
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>0</Text>
          </View>
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
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifBtn: {
    position: 'relative',
    padding: 4,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.red,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
};
