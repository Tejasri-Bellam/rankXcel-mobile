import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useFocusEffect } from "expo-router";

interface HeaderScrollValue {
  // True once the active screen has been scrolled past the top. Drives the
  // header background (transparent at the top, solid once scrolled).
  scrolled: boolean;
  setScrolled: (v: boolean) => void;
}

const HeaderScrollContext = createContext<HeaderScrollValue>({
  scrolled: false,
  setScrolled: () => {},
});

export function HeaderScrollProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [scrolled, setScrolledState] = useState(false);

  // Avoid redundant re-renders: only update when the boolean actually flips.
  const setScrolled = useCallback((v: boolean) => {
    setScrolledState((prev) => (prev === v ? prev : v));
  }, []);

  const value = useMemo(() => ({ scrolled, setScrolled }), [scrolled, setScrolled]);

  return (
    <HeaderScrollContext.Provider value={value}>
      {children}
    </HeaderScrollContext.Provider>
  );
}

export function useHeaderScroll(): HeaderScrollValue {
  return useContext(HeaderScrollContext);
}

// Drop-in for any header screen's scroll container: returns an `onScroll`
// handler that makes the shared header transparent at the top and solid once
// scrolled. The header is reset to transparent whenever the screen gains/loses
// focus, so it never stays solid when switching between screens.
export function useHeaderScrollHandler(
  threshold = 8
): (e: NativeSyntheticEvent<NativeScrollEvent>) => void {
  const { setScrolled } = useHeaderScroll();

  useFocusEffect(
    useCallback(() => {
      setScrolled(false);
      return () => setScrolled(false);
    }, [setScrolled])
  );

  return useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrolled(e.nativeEvent.contentOffset.y > threshold);
    },
    [setScrolled, threshold]
  );
}
