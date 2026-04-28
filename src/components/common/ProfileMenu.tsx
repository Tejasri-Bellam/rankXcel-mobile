import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions} from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
  const router = useRouter();

const COLORS = {
  primary: '#6C63FF',
  primaryLight: '#EEF0FF',
  background: '#F7F8FC',
  white: '#FFFFFF',
  textDark: '#1A1A2E',
  textMedium: '#4A4A6A',
  textLight: '#9898B0',
  green: '#22C55E',
  greenLight: '#DCFCE7',
  orange: '#F97316',
  orangeLight: '#FFF0E6',
  red: '#EF4444',
  redLight: '#FEE2E2',
  yellow: '#FBBF24',
  yellowLight: '#FEF9C3',
  border: '#E8E8F0',
  streakBg: '#FFF7ED',
  cardShadow: 'rgba(108, 99, 255, 0.08)',
};

export const ProfileMenu = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.profileOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.profileMenu}>
        <View style={styles.profileTop}>
          <Text style={styles.profileName}>Tejasri Bellam</Text>
          <Text style={styles.profileEmail}>tejasri@mailinator.com</Text>
        </View>

        <TouchableOpacity style={styles.profileItem}>
          <Ionicons name="person-outline" size={18} color="#555" />
          <Text style={styles.profileItemText}>View Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileItem}>
          <Ionicons name="log-out-outline" size={18} color="red" />
          <Text style={[styles.profileItemText, { color: "red" }]}>
            Log out
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};


// --Styles

const styles: any =({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 24 },

  profileOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999,
},

profileMenu: {
  position: "absolute",
  top: 60,
  right: 12,
  width: 190,
  backgroundColor: "#fff",
  borderRadius: 12,
  paddingVertical: 8,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 8,
},

profileTop: {
  paddingHorizontal: 14,
  paddingBottom: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},

profileName: {
  fontSize: 13,
  fontWeight: "700",
  color: "#111",
},

profileEmail: {
  fontSize: 11,
  color: "#777",
  marginTop: 2,
},

profileItem: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
},

profileItemText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#222",
}
});