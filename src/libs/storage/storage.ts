import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HAS_ONBOARDED: 'has_onboarded',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
  REGISTRATIONS: 'registrations',
} as const;

async function set(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}
async function get(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}
async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export const storage = {
  // Onboarding
  setOnboarded: () => set(KEYS.HAS_ONBOARDED, 'true'),
  getOnboarded: () => get(KEYS.HAS_ONBOARDED),

  // Global auth tokens
  setAccessToken: (token: string) => set(KEYS.ACCESS_TOKEN, token),
  getAccessToken: () => get(KEYS.ACCESS_TOKEN),
  removeAccessToken: () => remove(KEYS.ACCESS_TOKEN),

  setRefreshToken: (token: string) => set(KEYS.REFRESH_TOKEN, token),
  getRefreshToken: () => get(KEYS.REFRESH_TOKEN),
  removeRefreshToken: () => remove(KEYS.REFRESH_TOKEN),

  // Convenience: get token (alias for access token)
  getToken: () => get(KEYS.ACCESS_TOKEN),

  // User profile
  getProfile: async () => {
    const raw = await get(KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  },
  saveProfile: (profile: object) => set(KEYS.USER_PROFILE, JSON.stringify(profile)),
  removeProfile: () => remove(KEYS.USER_PROFILE),


  // Clear all auth data
  clearAll: async () => {
    await Promise.all([
      remove(KEYS.ACCESS_TOKEN),
      remove(KEYS.REFRESH_TOKEN),
      remove(KEYS.USER_PROFILE),
      remove(KEYS.REGISTRATIONS),
    ]);
  },
};
 