import type { DraftType } from "@os-tools/shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { API_BASE } from "../api";

const WS_BASE = API_BASE.replace(/^http/, "ws");
const RECONNECT_DELAY_MS = 3000;

interface RoomClient<TState, TCreate> {
  getRoom: (input: { roomId: string }) => Promise<TState>;
  createRoom: (input: TCreate) => Promise<TState>;
}

export function useRoomApi<T, TCreate>(
  roomId: string | null,
  path: DraftType,
  client: RoomClient<T, TCreate>,
  side?: string,
  live = true,
) {
  const [state, setState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    client
      .getRoom({ roomId })
      .then((data: T) => {
        if (!cancelled) {
          setState(data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    function connect() {
      if (cancelled) {
        return;
      }

      const wsUrl = side
        ? `${WS_BASE}/${path}/ws/rooms/${roomId}?side=${side}`
        : `${WS_BASE}/${path}/ws/rooms/${roomId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        if (!cancelled) {
          setState(JSON.parse(evt.data) as T);
          setLoading(false);
        }
      };

      ws.onclose = () => {
        if (!cancelled) {
          setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        // onclose fires after onerror, reconnect is handled there
      };
    }

    if (live) {
      connect();
    }

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [roomId, path, client, side, live]);

  const create = useCallback(
    async (config: TCreate): Promise<T> => {
      const data = await client.createRoom(config);
      setState(data);

      return data;
    },
    [client],
  );

  const runMutation = useCallback(async (operation: () => Promise<unknown>): Promise<void> => {
    setError(null);

    try {
      await operation();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Request failed");
    }
  }, []);

  return { state, loading, error, create, runMutation };
}
