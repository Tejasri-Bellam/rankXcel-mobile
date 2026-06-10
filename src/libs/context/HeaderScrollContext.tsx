import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

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
