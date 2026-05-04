import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions} from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from "@/src/styles/styles";

const { width } = Dimensions.get('window');
  const router = useRouter();

type HeaderProps = {
  onMenuPress: () => void;
  onProfilePress: () => void;
};

export default function Header({
  onMenuPress,
  onProfilePress,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn}>
        <Ionicons name="menu" size={24} color={COLORS.textDark} />
      </TouchableOpacity>

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
          <Text style={styles.avatarText}>TB</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --Styles

const styles: any=({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 24 },

  // Header
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  menuBtn: { padding: 4 },
  headerTitle: { flex: 1, marginLeft: 12, fontSize: 17, fontWeight: '700', color: COLORS.textDark },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: { position: 'relative', padding: 4 },
  notifBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: COLORS.red, borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  notifBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 12, fontWeight: '700' }
});