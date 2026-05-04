import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { getPlatformSettings } from "@/libs/services/platform/platformService";
import type { PlatformSettings } from "@/types/platform";

const CACHE_KEY = "trainly_platform_settings";

export function usePlatformSettings(): {
  settings: PlatformSettings | null;
  isLoading: boolean;
} {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1. Try cached first for instant render
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && !cancelled) {
          setSettings(JSON.parse(cached));
          setIsLoading(false);
        }
      } catch {
        // cache miss — continue to fetch
      }

      // 2. Always fetch fresh from API
      try {
        const { data } = await getPlatformSettings();
        if (!cancelled) {
          setSettings(data);
          setIsLoading(false);
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }
      } catch {
        // If fetch fails and we had no cache, stop loading
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { settings, isLoading };
}
