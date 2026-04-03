import { useState, useEffect, useCallback, useRef } from "react";
import type { MapDraftState, SequenceKey } from "@map-drafter/types";
import type { Team } from "@/features/common/constants";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const WS_BASE = API_BASE.replace(/^http/, "ws");

const RECONNECT_DELAY_MS = 3000;

export interface CreateRoomConfig {
  blueName: string;
  redName: string;
  bestOf: SequenceKey;
  maps: string[];
}

export function useMapDraftApi(roomId: string | null) {
  const [state, setState] = useState<MapDraftState | null>(null);
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

    fetch(`${API_BASE}/map-draft/rooms/${roomId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Room not found");
        return r.json();
      })
      .then((data: MapDraftState) => {
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

      const ws = new WebSocket(`${WS_BASE}/map-draft/ws/rooms/${roomId}`);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        if (!cancelled) {
          setState(JSON.parse(evt.data) as MapDraftState);
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
  }, [roomId]);

  const create = useCallback(
    async (config: CreateRoomConfig): Promise<MapDraftState> => {
      const resp = await fetch(`${API_BASE}/map-draft/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail ?? "Failed to create room");
      }
      const data: MapDraftState = await resp.json();
      setState(data);
      return data;
    },
    [],
  );

  const applyAction = useCallback(
    async (map: string): Promise<void> => {
      if (!roomId) return;
      const resp = await fetch(`${API_BASE}/map-draft/rooms/${roomId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ map }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail ?? "Action failed");
      }
      // State update arrives via WebSocket broadcast
    },
    [roomId],
  );

  const setPending = useCallback(
    async (side: Team.Blue | Team.Red, map: string | null): Promise<void> => {
      if (!roomId) return;
      await fetch(`${API_BASE}/map-draft/rooms/${roomId}/pending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, map }),
      });
      // State update arrives via WebSocket broadcast
    },
    [roomId],
  );

  const ready = useCallback(
    async (side: Team.Blue | Team.Red): Promise<void> => {
      if (!roomId) return;
      const resp = await fetch(`${API_BASE}/map-draft/rooms/${roomId}/ready`, {
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
    [roomId],
  );

  return { state, loading, error, create, applyAction, setPending, ready };
}
