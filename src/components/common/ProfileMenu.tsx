import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from "@/src/styles/styles";
import { logoutService } from '@/src/libs/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width } = Dimensions.get('window');
const router = useRouter();



export const ProfileMenu = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  if (!visible) return null;

  const handleLogout = async () => {
    try {
      await logoutService(); // API call

      // Clear stored data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      // Navigate to login (reset stack)
      router.replace('/auth/login'); // adjust route if needed
    } catch (error: any) {
      console.error("Logout Error:", error);

      // Even if API fails, still clear local session
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      router.replace('/auth/login');
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: handleLogout }
      ]
    );
  };

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

        <TouchableOpacity style={styles.profileItem} onPress={confirmLogout}>
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

const styles: any = ({
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