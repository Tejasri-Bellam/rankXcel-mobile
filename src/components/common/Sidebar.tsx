import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { logoutService } from '@/src/libs/services/auth';
import { getMeService } from '@/src/libs/services/profile';
import { storageGetAccessToken } from '@/src/libs/storage';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#6C63FF',
  white: '#FFFFFF',
  textDark: '#1A1A2E',
  textMedium: '#4A4A6A',
  textLight: '#9898B0',
  red: '#EF4444',
  border: '#E8E8F0',
};

type DrawerProps = {
  visible: boolean;
  onClose: () => void;
};

export default function Sidebar({
  visible,
  onClose,
}: DrawerProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState({
    name: '',
    email: '',
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch User
  useEffect(() => {
    if (visible) {
      checkAuthAndFetchUser();
    }
  }, [visible]);

  const checkAuthAndFetchUser = async () => {
    const token = await storageGetAccessToken();
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    if (!loggedIn) {
      setUser({ name: 'Guest', email: '' });
      return;
    }

    try {
      const res: any = await getMeService();

      console.log('User data:', res?.data);

      setUser({
        name: res?.data?.name || 'User',
        email: res?.data?.email || '',
      });
    } catch (error) {
      console.error('Get user failed:', error);

      // fallback from AsyncStorage
      const savedUser = await AsyncStorage.getItem('user');

      if (savedUser) {
        const parsed = JSON.parse(savedUser);

        setUser({
          name: parsed?.name || 'User',
          email: parsed?.email || '',
        });
      }
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out...');

      await logoutService();

      console.log('Logout API success');
    } catch (error) {
      console.error('Logout Error:', error);
    } finally {
      await AsyncStorage.multiRemove([
        'accessToken',
        'user',
      ]);

      console.log('Local session cleared');

      setIsLoggedIn(false);

      onClose();

        router.replace("/");
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: handleLogout,
        },
      ]
    );
  };

  if (!visible) return null;

  const navItems = [
    {
      icon: 'grid-outline',
      label: 'Dashboard',
      route: '/dashboard',
      status: 'active',
    },
    {
      icon: 'barbell-outline',
      label: 'Practice',
      route: '/practice',
      status: 'active',
    },
    {
      icon: 'clipboard-outline',
      label: 'Assessments',
      route: '/assessments',
      status: 'active',
    },
    {
      icon: 'document-text-outline',
      label: 'Mock Exam',
      route: '/mock-library',
      status: 'active',
    },
    {
      icon: 'analytics-outline',
      label: 'Analytics',
      route: '/analytics',
      status: 'active',
    },
    {
      icon: 'bulb-outline',
      label: 'Strategy',
      status: 'inactive',
    },
    {
      icon: 'cloud-upload-outline',
      label: 'Upload Paper',
      status: 'inactive',
    },
    {
      icon: 'person-outline',
      label: 'Profile',
      route: '/profile',
      status: 'active',
    },
  ];

  return (
    <TouchableOpacity
      style={styles.drawerOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.drawerContainer}>
        {/* Header */}
        <View style={styles.drawerHeader}>
          <Text style={styles.logo}>RX</Text>

          <Text style={styles.brand}>RankXcel</Text>

          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={22}
              color="#111"
            />
          </TouchableOpacity>
        </View>

        {/* Navigation */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: 12,
          }}
        >
          {navItems.map((item) => {
            const isDisabled =
              item.status === 'inactive';

            const active =
              !isDisabled &&
              (pathname === item.route ||
                (pathname === '' &&
                  item.route === '/') ||
                (pathname === '/index' &&
                  item.route === '/'));

            return (
              <TouchableOpacity
                key={item.label}
                disabled={isDisabled}
                activeOpacity={
                  isDisabled ? 1 : 0.7
                }
                style={[
                  styles.navItem,
                  active &&
                    styles.navItemActive,
                  isDisabled &&
                    styles.navItemDisabled,
                ]}
                onPress={() => {
                  if (isDisabled) return;

                  router.push(item.route as any);

                  onClose();
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={
                    isDisabled
                      ? '#C4C4C4'
                      : active
                      ? '#fff'
                      : '#555'
                  }
                />

                <Text
                  style={[
                    styles.navLabel,
                    active &&
                      styles.navLabelActive,
                    isDisabled &&
                      styles.navLabelDisabled,
                  ]}
                >
                  {item.label}

                  {isDisabled
                    ? ' (Coming Soon)'
                    : ''}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Footer */}
          <View style={styles.drawerFooter}>
            <View>
              <Text style={styles.drawerUserName}>
                {user.name}
              </Text>

              <Text style={styles.drawerUserEmail}>
                {user.email}
              </Text>
            </View>

            {isLoggedIn ? (
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={confirmLogout}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={COLORS.red}
                />

                <Text style={styles.logoutText}>
                  Log out
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  onClose();
                  router.push('/auth/login');
                }}
              >
                <Ionicons
                  name="log-in-outline"
                  size={18}
                  color={COLORS.primary}
                />

                <Text style={styles.loginText}>
                  Login
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 100,
    flexDirection: 'row',
  },

  drawerContainer: {
    width: width * 0.75,
    backgroundColor: COLORS.white,
    paddingTop: 52,
    paddingBottom: 32,
  },

  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 28,
  },

  logo: {
    backgroundColor: COLORS.primary,
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    fontWeight: '700',
  },

  brand: {
    flex: 1,
    marginLeft: 10,
    fontWeight: '700',
    fontSize: 18,
  },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  navItemActive: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 12,
  },

  navItemDisabled: {
    opacity: 0.8,
  },

  navLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMedium,
  },

  navLabelActive: {
    color: COLORS.white,
  },

  navLabelDisabled: {
    color: '#BDBDBD',
  },

  drawerFooter: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },

  drawerUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  drawerUserEmail: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },

  logoutText: {
    color: COLORS.red,
    fontWeight: '600',
    fontSize: 14,
  },

  loginText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});