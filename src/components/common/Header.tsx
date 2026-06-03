import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from "@/src/styles/styles";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMeService } from '@/src/libs/services/profile';
import { useTargetExam } from '@/src/libs/context/TagretExamContext';

const { width } = Dimensions.get('window');

type HeaderProps = {
  onMenuPress: () => void;
  onProfilePress: () => void;
};

export default function Header({
  onMenuPress,
  onProfilePress,
}: HeaderProps) {
  const [avatarText, setAvatarText] = useState("AB");

  const {
    targetExams,
    activeExamId,
    setActiveExamId,
    refreshExams,
  } = useTargetExam();

  const [examMenuOpen, setExamMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  // Target exam list loading.
  useEffect(() => {
    if (!targetExams.length) refreshExams();
  }, [targetExams.length, refreshExams]);

  const fetchUser = async () => {
    try {
      const res : any = await getMeService();

      const name = res?.data?.name || "";
      const initials = getInitials(name);

      setAvatarText(initials);

      // optional: save user
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(res?.data)
      );
    } catch (error) {
      console.log("User fetch failed:", error);

      const savedUser = await AsyncStorage.getItem("user");

      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const initials = getInitials(parsed?.name || "");

        setAvatarText(initials);
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "AB";

    const parts = name.trim().split(" ");

    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }

    return (
      parts[0][0] + parts[1][0]
    ).toUpperCase();
  };

  const activeExam = targetExams.find(
    (e) => String(e.id) === String(activeExamId)
  );
  const activeLabel = activeExam?.name || "Exam";

  const handleSelectExam = (id: number | string) => {
    setActiveExamId(id);
    setExamMenuOpen(false);
  };

  return (

    <View style={styles.header}>
      <TouchableOpacity
        onPress={onMenuPress}
        style={styles.menuBtn}
      >
        <Ionicons
          name="menu"
          size={24}
          color={COLORS.textDark}
        />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        RankXcel
      </Text>

      <View style={styles.headerRight}>
        {targetExams.length > 0 && (
          <TouchableOpacity
            style={styles.examPill}
            onPress={() => setExamMenuOpen(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="book-open-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text
              style={styles.examPillText}
              numberOfLines={1}
            >
              {activeLabel}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons
            name="notifications-outline"
            size={22}
            color={COLORS.textDark}
          />

          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>
              0
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatar}
          onPress={onProfilePress}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>
            {avatarText}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={examMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setExamMenuOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setExamMenuOpen(false)}
        >
          <Pressable style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>My Target Exam</Text>

            <ScrollView
              style={styles.dropdownList}
              showsVerticalScrollIndicator={false}
            >
              {targetExams.map((exam) => {
                const isActive = String(exam.id) === String(activeExamId);
                return (
                  <TouchableOpacity
                    key={String(exam.id)}
                    style={[
                      styles.dropdownItem,
                      isActive && styles.dropdownItemActive,
                    ]}
                    onPress={() => handleSelectExam(exam.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="book-open-outline"
                      size={18}
                      color={isActive ? COLORS.primary : COLORS.textLight}
                    />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isActive && styles.dropdownItemTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {exam.name}
                    </Text>
                    {isActive && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>

  );
}

const styles: any = ({
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
    position: 'relative',
  },

  menuBtn: {
    padding: 4,
  },

  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  examPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 120,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },

  examPillText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingTop: 64,
    paddingRight: 16,
    alignItems: 'flex-end',
  },

  dropdown: {
    width: Math.min(280, width - 32),
    maxHeight: 360,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },  },

  dropdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },

  dropdownList: {
    flexGrow: 0,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 10,
  },

  dropdownItemActive: {
    backgroundColor: COLORS.primaryLight,
  },

  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMedium,
  },

  dropdownItemTextActive: {
    color: COLORS.primary,
  },
});
 