import {
  type Awakening,
  type CreateMapDraftRoomRequest,
  type GameMap,
  type MapDraftState,
  type Team as Side,
  Team,
} from "@os-tools/shared";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useMapDraftApi } from "../hooks/useMapDraftApi";

interface MapDraftContextValue {
  state: MapDraftState | null;
  lobbyState: MapDraftState | null;
  loading: boolean;
  error: string | null;
  side: Side;
  roomId: string | null;
  handleLaunch: (config: CreateMapDraftRoomRequest) => Promise<void>;
  handleSidePick: (side: Side) => void;
  handleAction: (map: GameMap) => Promise<void>;
  handlePending: (map: GameMap | null) => Promise<void>;
  handleReady: () => Promise<void>;
  handleReset: () => void;
  handleSetStrikerRoom: (
    map: GameMap,
    roomId: string,
    firstPick: string,
    bannedAwakenings: Awakening[],
  ) => Promise<void>;
}

const MapDraftContext = createContext<MapDraftContextValue | null>(null);

export function useMapDraftContext(): MapDraftContextValue {
  const ctx = useContext(MapDraftContext);
  if (!ctx) {
    throw new Error("useMapDraftContext must be used inside MapDraftProvider");
  }
  return ctx;
}

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    roomId: params.get("room"),
    side: params.get("side") as Side | null,
    replay: params.get("replay") === "1",
  };
}

export function MapDraftProvider({ children }: { children: ReactNode }) {
  const { roomId: urlRoom, side: urlSide, replay } = getUrlParams();
  const navigate = useNavigate();

  const [side, setSide] = useState<Side>(replay ? Team.Spectator : (urlSide ?? Team.Spectator));
  const [roomId, setRoomId] = useState<string | null>(urlRoom);
  const [lobbyState, setLobbyState] = useState<MapDraftState | null>(null);
  const [localPending, setLocalPending] = useState<GameMap | null>(null);

  useEffect(() => {
    if (!replay) {
      return;
    }
    const url = new URL(window.location.href);
    if (!url.searchParams.has("side")) {
      return;
    }
    url.searchParams.delete("side");
    window.history.replaceState({}, "", url.toString());
  }, [replay]);

  const { state, loading, error, create, applyAction, setPending, ready, setStrikerRoom } = useMapDraftApi(
    roomId,
    side,
    !replay,
  );

  useEffect(() => {
    if (!replay || loading || !state) {
      return;
    }
    if (state.done && state.replayEvents?.length) {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("replay");
    url.searchParams.delete("side");
    window.location.replace(url.toString());
  }, [loading, replay, state]);

  useEffect(() => {
    setLocalPending(null);
  }, [state?.step]);

  const clientState = state
    ? {
        ...state,
        ...(side === Team.Blue ? { pendingBlue: localPending } : side === Team.Red ? { pendingRed: localPending } : {}),
      }
    : null;

  // Redirect from base path when URL has room+side params (e.g. from a shared lobby link)
  useEffect(() => {
    const pathname = window.location.pathname;
    const isBasePath = pathname === "/map-draft" || pathname === "/map-draft/";
    if (!isBasePath) {
      return;
    }
    const search = window.location.search;
    if (urlRoom && (urlSide || replay)) {
      navigate(`/map-draft/draft${search}`, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLaunch(config: CreateMapDraftRoomRequest) {
    const newState = await create(config);
    setLobbyState(newState);
    setRoomId(newState.roomId);
    navigate(`/map-draft/lobby?room=${newState.roomId}`);
  }

  function handleSidePick(chosenSide: Side) {
    setSide(chosenSide);
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId!);
    url.searchParams.set("side", chosenSide);
    window.history.replaceState({}, "", url.toString());
    navigate(`/map-draft/draft${url.search}`);
  }

  async function handleAction(map: GameMap) {
    if (replay) {
      return;
    }
    await applyAction(map);
  }

  async function handlePending(map: GameMap | null) {
    if (replay) {
      return;
    }
    if (side === Team.Blue || side === Team.Red) {
      setLocalPending(map);
      await setPending(side, map);
    }
  }

  async function handleReady() {
    if (replay) {
      return;
    }
    if (side === Team.Blue || side === Team.Red) {
      await ready(side);
    }
  }

  async function handleSetStrikerRoom(map: GameMap, roomId: string, firstPick: string, bannedAwakenings: Awakening[]) {
    await setStrikerRoom(map, roomId, firstPick, bannedAwakenings);
  }

  function handleReset() {
    window.history.replaceState({}, "", "/map-draft");
    setRoomId(null);
    setLobbyState(null);
    setSide(Team.Spectator);
    navigate("/map-draft");
  }

  return (
    <MapDraftContext.Provider
      value={{
        state: clientState,
        lobbyState,
        loading,
        error,
        side,
        roomId,
        handleLaunch,
        handleSidePick,
        handleAction,
        handlePending,
        handleReady,
        handleReset,
        handleSetStrikerRoom,
      }}
    >
      {children}
    </MapDraftContext.Provider>
  );
}
