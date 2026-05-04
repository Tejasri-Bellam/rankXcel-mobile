import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "trainly_access_token";
const USER_DETAILS = "trainly_user_details";

export async function storageGetAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function storageSetAccessToken(token: string | null): Promise<void> {
  if (token) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  }
}

export async function storageGetUser<T>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(USER_DETAILS);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function storageSetUser<T>(user: T | null): Promise<void> {
  if (user !== null) {
    await AsyncStorage.setItem(USER_DETAILS, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(USER_DETAILS);
  }
}
