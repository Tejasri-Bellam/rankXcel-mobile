import { useCallback, useRef, useState } from "react";
import {
  updateChapterProgress,
  completeChapter as completeChapterRequest,
} from "@/libs/services/player/learningService";
import type { ChapterProgressResponse } from "@/types/player";

interface UseChapterProgressResult {
  startSession: (chapterId: number) => Promise<number | null>;
  sendHeartbeat: (
    chapterId: number,
    lastPosition?: number,
    watchPercentage?: string,
  ) => Promise<void>;
  endSession: (
    chapterId: number,
    lastPosition?: number,
    watchPercentage?: string,
  ) => Promise<void>;
  completeChapter: (chapterId: number) => Promise<ChapterProgressResponse | null>;
  isCompleting: boolean;
}

export function useChapterProgress(): UseChapterProgressResult {
  const [isCompleting, setIsCompleting] = useState(false);
  // Maps chapterId → active session ID
  const sessionMap = useRef<Record<number, number | null>>({});

  const startSession = useCallback(async (chapterId: number): Promise<number | null> => {
    try {
      const { data } = await updateChapterProgress(chapterId, {
        session_action: "start",
      });
      sessionMap.current[chapterId] = data.active_session_id;
      return data.active_session_id;
    } catch {
      return null;
    }
  }, []);

  const sendHeartbeat = useCallback(
    async (
      chapterId: number,
      lastPosition?: number,
      watchPercentage?: string,
    ) => {
      const sid = sessionMap.current[chapterId];
      if (!sid) return;
      try {
        await updateChapterProgress(chapterId, {
          session_action: "heartbeat",
          session_id: sid,
          last_video_position: lastPosition,
          video_watch_percentage: watchPercentage,
        });
      } catch {
        // silent — heartbeat is best-effort
      }
    },
    [],
  );

  const endSession = useCallback(
    async (chapterId: number, lastPosition?: number, watchPercentage?: string) => {
      const sid = sessionMap.current[chapterId];
      if (!sid) return;
      delete sessionMap.current[chapterId];
      try {
        await updateChapterProgress(chapterId, {
          session_action: "end",
          session_id: sid,
          last_video_position: lastPosition,
          video_watch_percentage: watchPercentage,
        });
      } catch {
        // silent — session end is best-effort
      }
    },
    [],
  );

  const completeChapter = useCallback(
    async (chapterId: number): Promise<ChapterProgressResponse | null> => {
      setIsCompleting(true);
      try {
        const { data } = await completeChapterRequest(chapterId);
        return data;
      } catch {
        return null;
      } finally {
        setIsCompleting(false);
      }
    },
    [],
  );

  return { startSession, sendHeartbeat, endSession, completeChapter, isCompleting };
}
