import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { StrikerDraftState } from "@/features/striker-draft/types";
import type { Side } from "@/features/common/types";
import { Team } from "@/features/common/constants/constants";
import {
  useStrikerDraftApi,
  type CreateStrikerRoomConfig,
} from "@/features/striker-draft/hooks/useStrikerDraftApi";

interface StrikerDraftContextValue {
  state: StrikerDraftState | null;
  lobbyState: StrikerDraftState | null;
  loading: boolean;
  error: string | null;
  side: Side;
  roomId: string | null;
  handleLaunch: (config: CreateStrikerRoomConfig) => Promise<void>;
  handleSidePick: (side: Side) => void;
  handleAction: (striker: string | null) => Promise<void>;
  handlePending: (striker: string | null) => Promise<void>;
  handleReady: () => Promise<void>;
  handleReset: () => void;
}

const StrikerDraftContext = createContext<StrikerDraftContextValue | null>(
  null,
);

export function useStrikerDraftContext(): StrikerDraftContextValue {
  const ctx = useContext(StrikerDraftContext);
  if (!ctx)
    throw new Error(
      "useStrikerDraftContext must be used inside StrikerDraftProvider",
    );
  return ctx;
}

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    roomId: params.get("room"),
    side: params.get("side") as Side | null,
  };
}

export function StrikerDraftProvider({ children }: { children: ReactNode }) {
  const { roomId: urlRoom, side: urlSide } = getUrlParams();
  const navigate = useNavigate();

  const [side, setSide] = useState<Side>(urlSide ?? Team.Spectator);
  const [roomId, setRoomId] = useState<string | null>(urlRoom);
  const [lobbyState, setLobbyState] = useState<StrikerDraftState | null>(null);

  const { state, loading, error, create, applyAction, setPending, ready } =
    useStrikerDraftApi(roomId);

  useEffect(() => {
    const pathname = window.location.pathname;
    const isBasePath =
      pathname === "/striker-draft" || pathname === "/striker-draft/";
    if (!isBasePath) return;
    const search = window.location.search;
    if (urlRoom && urlSide) {
      navigate(`/striker-draft/draft${search}`, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLaunch(config: CreateStrikerRoomConfig) {
    const newState = await create(config);
    setLobbyState(newState);
    setRoomId(newState.roomId);
    navigate(`/striker-draft/lobby?room=${newState.roomId}`);
  }

  function handleSidePick(chosenSide: Side) {
    setSide(chosenSide);
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId!);
    url.searchParams.set("side", chosenSide);
    window.history.replaceState({}, "", url.toString());
    navigate(`/striker-draft/draft${url.search}`);
  }

  async function handleAction(striker: string | null) {
    await applyAction(striker);
  }

  async function handlePending(striker: string | null) {
    if (side === Team.Blue || side === Team.Red) {
      await setPending(side, striker);
    }
  }

  async function handleReady() {
    if (side === Team.Blue || side === Team.Red) {
      await ready(side);
    }
  }

  function handleReset() {
    window.history.replaceState({}, "", "/striker-draft");
    setRoomId(null);
    setLobbyState(null);
    setSide(Team.Spectator);
    navigate("/striker-draft");
  }

  return (
    <StrikerDraftContext.Provider
      value={{
        state,
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
      }}
    >
      {children}
    </StrikerDraftContext.Provider>
  );
}
