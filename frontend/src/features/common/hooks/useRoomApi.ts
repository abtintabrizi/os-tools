import { useState, useEffect, useCallback, useRef } from "react";
import type { Team } from "@/features/common/constants";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const WS_BASE = API_BASE.replace(/^http/, "ws");

const RECONNECT_DELAY_MS = 3000;

export interface RoomApi<T> {
  state: T | null;
  loading: boolean;
  error: string | null;
  create: (config: object) => Promise<T>;
  applyAction: (payload: Record<string, unknown>) => Promise<void>;
  setPending: (payload: Record<string, unknown>) => Promise<void>;
  ready: (side: Team.Blue | Team.Red) => Promise<void>;
}

export function useRoomApi<T>(roomId: string | null, path: string): RoomApi<T> {
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

    fetch(`${API_BASE}/${path}/rooms/${roomId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Room not found");
        return r.json();
      })
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
      if (cancelled) return;

      const ws = new WebSocket(`${WS_BASE}/${path}/ws/rooms/${roomId}`);
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

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [roomId, path]);

  const create = useCallback(
    async (config: object): Promise<T> => {
      const resp = await fetch(`${API_BASE}/${path}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail ?? "Failed to create room");
      }
      const data: T = await resp.json();
      setState(data);
      return data;
    },
    [path],
  );

  const applyAction = useCallback(
    async (payload: Record<string, unknown>): Promise<void> => {
      if (!roomId) return;
      const resp = await fetch(`${API_BASE}/${path}/rooms/${roomId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail ?? "Action failed");
      }
      // State update arrives via WebSocket broadcast
    },
    [roomId, path],
  );

  const setPending = useCallback(
    async (payload: Record<string, unknown>): Promise<void> => {
      if (!roomId) return;
      await fetch(`${API_BASE}/${path}/rooms/${roomId}/pending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // State update arrives via WebSocket broadcast
    },
    [roomId, path],
  );

  const ready = useCallback(
    async (side: Team.Blue | Team.Red): Promise<void> => {
      if (!roomId) return;
      const resp = await fetch(`${API_BASE}/${path}/rooms/${roomId}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail ?? "Ready failed");
      }
      // State update arrives via WebSocket broadcast
    },
    [roomId, path],
  );

  return { state, loading, error, create, applyAction, setPending, ready };
}
