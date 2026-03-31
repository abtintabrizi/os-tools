import { useState, useEffect } from "react";
import type { Page, Side, DraftState } from "@/features/map-drafter/types";
import { useDraftState } from "@/features/map-drafter/hooks/useDraftState";
import SetupPage from "@/features/map-drafter/pages/SetupPage";
import LobbyPage from "@/features/map-drafter/pages/LobbyPage";
import SidePickPage from "@/features/map-drafter/pages/SidePickPage";
import DraftPage from "@/features/map-drafter/pages/DraftPage";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    roomId: params.get("room"),
    side: params.get("side") as Side | null,
  };
}

export default function MapDrafter() {
  const { roomId: urlRoom, side: urlSide } = getUrlParams();

  // If the URL already has a room+side, jump straight to draft
  const [page, setPage] = useState<Page>(() => {
    if (urlRoom && urlSide) return "draft";
    if (urlRoom) return "pick";
    return "setup";
  });
  const [side, setSide] = useState<Side>(urlSide ?? "spectator");
  const [roomId, setRoomId] = useState<string | null>(urlRoom);
  const [lobbyState, setLobbyState] = useState<DraftState | null>(null);

  const { state, loading, error, update, create } = useDraftState(roomId);

  async function handleLaunch(newState: DraftState) {
    setRoomId(newState.roomId);
    setLobbyState(newState);
    await create(newState);
    setPage("lobby");
  }

  function handleSidePick(chosenSide: Side) {
    setSide(chosenSide);
    // Update URL so refreshing keeps the side
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId!);
    url.searchParams.set("side", chosenSide);
    window.history.replaceState({}, "", url.toString());
    setPage("draft");
  }

  async function handleAction(next: DraftState) {
    await update(next);
  }

  function handleReset() {
    window.history.replaceState({}, "", window.location.pathname);
    setRoomId(null);
    setLobbyState(null);
    setSide("spectator");
    setPage("setup");
  }

  if (error) {
    return (
      <div
        style={{ padding: "2rem", fontFamily: "monospace", color: "#f87171" }}
      >
        <strong>Supabase error:</strong> {error}
        <br />
        <br />
        Make sure your <code>.env</code> file is set up — see{" "}
        <code>SUPABASE_SETUP.md</code>.
      </div>
    );
  }

  return (
    <>
      {page === "setup" && <SetupPage onLaunch={handleLaunch} />}

      {page === "lobby" && lobbyState && (
        <LobbyPage state={lobbyState} onEnter={handleSidePick} />
      )}

      {page === "pick" &&
        (loading ? (
          <LoadingScreen message="Loading draft room..." />
        ) : state ? (
          <SidePickPage state={state} onPick={handleSidePick} />
        ) : (
          <ErrorScreen message="Room not found. Check your link." />
        ))}

      {page === "draft" &&
        (loading ? (
          <LoadingScreen message="Connecting to draft..." />
        ) : state ? (
          <DraftPage
            state={state}
            side={side}
            onAction={handleAction}
            onReset={handleReset}
          />
        ) : (
          <ErrorScreen message="Room not found. Check your link." />
        ))}
    </>
  );
}
