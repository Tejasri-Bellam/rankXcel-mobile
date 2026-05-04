import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

interface NetworkState {
  isLoading: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

interface NetworkContextValue extends NetworkState {
  updateNetworkStatus: (status: NetworkState) => void;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

const INITIAL: NetworkState = {
  isLoading: true,
  isConnected: null,
  isInternetReachable: null,
};

interface NetworkProviderProps {
  children: React.ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps): React.ReactElement {
  const [state, setState] = useState<NetworkState>(INITIAL);

  const updateNetworkStatus = useCallback((status: NetworkState) => {
    setState(status);
  }, []);

  const value = useMemo<NetworkContextValue>(
    () => ({ ...state, updateNetworkStatus }),
    [state, updateNetworkStatus],
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetworkContext(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetworkContext must be used within NetworkProvider");
  return ctx;
}
