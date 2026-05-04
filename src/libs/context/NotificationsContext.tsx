import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getUnreadCount } from "@/libs/services/notifications/notificationFeedService";
import { useAuthContext } from "./AuthContext";

interface NotificationsContextValue {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  decrementUnread: (by?: number) => void;
  resetUnread: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export function NotificationsProvider({
  children,
}: NotificationsProviderProps): React.ReactElement {
  const { isAuthenticated } = useAuthContext();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const { data } = await getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch {
      // silent — badge is non-critical
    }
  }, [isAuthenticated]);

  // Fetch once when the user becomes authenticated; clear on logout.
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    refreshUnreadCount();
  }, [isAuthenticated, refreshUnreadCount]);

  const decrementUnread = useCallback((by: number = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - by));
  }, []);

  const resetUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({ unreadCount, refreshUnreadCount, decrementUnread, resetUnread }),
    [unreadCount, refreshUnreadCount, decrementUnread, resetUnread],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotificationsContext must be used within NotificationsProvider");
  return ctx;
}
