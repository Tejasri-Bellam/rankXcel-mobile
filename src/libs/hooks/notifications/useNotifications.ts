import { useCallback, useEffect, useState, useRef } from "react";
import {
  getNotifications,
  markAsRead as markAsReadRequest,
  markAllAsRead as markAllAsReadRequest,
} from "@/libs/services/notifications/notificationFeedService";
import type { AppNotification } from "@/types/notifications";
import { useNotificationsContext } from "@/libs/context/NotificationsContext";

const PAGE_SIZE = 20;

interface UseNotificationsOptions {
  search?: string;
  unreadOnly?: boolean;
}

interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications(
  enabled: boolean,
  options: UseNotificationsOptions = {},
): UseNotificationsResult {
  const { search = "", unreadOnly = false } = options;
  const { unreadCount, refreshUnreadCount, decrementUnread, resetUnread } = useNotificationsContext();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const searchRef = useRef(search);
  searchRef.current = search;
  const unreadOnlyRef = useRef(unreadOnly);
  unreadOnlyRef.current = unreadOnly;
  const notificationsRef = useRef<AppNotification[]>([]);
  notificationsRef.current = notifications;

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!enabled) return;
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      try {
        const { data } = await getNotifications({
          page: pageNum,
          pageSize: PAGE_SIZE,
          search: searchRef.current,
          unreadOnly: unreadOnlyRef.current,
        });
        setNotifications((prev) =>
          append ? [...prev, ...data.results] : data.results,
        );
        setHasMore(data.next !== null);
        setPage(pageNum);
      } catch {
        // silent
      } finally {
        if (append) setIsLoadingMore(false);
        else setIsLoading(false);
      }
    },
    [enabled],
  );

  // Load initial page + reload on search/filter change
  useEffect(() => {
    if (!enabled) return;
    fetchPage(1, false);
  }, [enabled, search, unreadOnly, fetchPage]);

  const refresh = useCallback(() => {
    fetchPage(1, false);
    refreshUnreadCount();
  }, [fetchPage, refreshUnreadCount]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;
    fetchPage(page + 1, true);
  }, [hasMore, isLoadingMore, isLoading, page, fetchPage]);

  const markAsRead = useCallback(
    async (id: number) => {
      const wasUnread = notificationsRef.current.some((n) => n.id === id && !n.is_read);
      if (wasUnread) decrementUnread(1);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id && !n.is_read ? { ...n, is_read: true } : n)),
      );
      try {
        await markAsReadRequest(id);
      } catch {
        if (wasUnread) refreshUnreadCount();
      }
    },
    [decrementUnread, refreshUnreadCount],
  );

  const markAllAsRead = useCallback(async () => {
    const hadUnread = notificationsRef.current.some((n) => !n.is_read);
    if (hadUnread) resetUnread();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllAsReadRequest();
    } catch {
      if (hadUnread) refreshUnreadCount();
    }
  }, [resetUnread, refreshUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
}
