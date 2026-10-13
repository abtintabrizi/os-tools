import { useEffect, useState } from "react";
import { GameMap, Team } from "@/features/common/constants/constants";
import { HomeButton } from "@/features/common/components/NavButtons";
import { useToast } from "@/features/common/components/Toast";
import TacticsBoard from "../components/TacticsBoard";
import TacticsToolbar from "../components/TacticsToolbar";
import StrikerPalette from "../components/StrikerPalette";
import { DRAW_COLORS, TACTICS_MAPS } from "../constants";
import { initialBoard, useTacticsBoard } from "../hooks/useTacticsBoard";
import { exportImage } from "../exportImage";
import type { PlayingTeam, Tool } from "../types";

export default function TacticsPage() {
  const { board, commit, undo, redo, canUndo, canRedo } = useTacticsBoard();
  const [mapName, setMapName] = useState<string>(GameMap.AhtenCity);
  const [tool, setTool] = useState<Tool>("move");
  const [color, setColor] = useState(DRAW_COLORS[0]);
  const [width, setWidth] = useState(6);
  const [team, setTeam] = useState<PlayingTeam>(Team.Blue);
  const [saving, setSaving] = useState(false);
  const [cancelVersion, setCancelVersion] = useState(0);
  const { toast } = useToast();
  const map = TACTICS_MAPS.find((item) => item.name === mapName) ?? TACTICS_MAPS[0];

  const cancel = () => setCancelVersion((value) => value + 1);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, select, textarea, [contenteditable=true]")) return;
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && (key === "z" || (event.ctrlKey && key === "y"))) {
        event.preventDefault();
        setCancelVersion((value) => value + 1);
        if (key === "y" || event.shiftKey) redo();
        else undo();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const imageError = () =>
    toast({
      message: "An image could not be loaded. Refresh the page to try again.",
      variant: "error",
    });

  if (!map) {
    return (
      <main className="mx-auto flex max-w-360 flex-col gap-5 p-6">
        <HomeButton />
        <h1 className="text-3xl font-bold">Tactics</h1>
        <p className="text-white/60">No maps with clear images are available.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-360 flex-col gap-5 px-4 py-6 lg:px-8">
      <header className="flex items-center justify-between gap-4">
        <HomeButton />
        <h1 className="text-3xl font-bold">Tactics</h1>
        <span className="text-xs text-white/40">Whiteboard</span>
      </header>
      <TacticsToolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        width={width}
        setWidth={setWidth}
        canUndo={canUndo}
        canRedo={canRedo}
        undo={() => {
          cancel();
          undo();
        }}
        redo={() => {
          cancel();
          redo();
        }}
        reset={() => {
          cancel();
          commit(initialBoard());
        }}
        saving={saving}
        save={async () => {
          cancel();
          setSaving(true);
          try {
            await exportImage(board, map);
          } catch {
            toast({
              message: "Could not save the image. Check that the map and striker images loaded, then try again.",
              variant: "error",
            });
          } finally {
            setSaving(false);
          }
        }}
      />
      <TacticsBoard
        board={board}
        commit={commit}
        map={map.image}
        tool={tool}
        color={color}
        width={width}
        team={team}
        cancelVersion={cancelVersion}
        onImageError={imageError}
      />
      <StrikerPalette team={team} setTeam={setTeam} onImageError={imageError} />
      <footer className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-xs leading-relaxed text-white/40">
          Drag strikers onto the map. Move repositions pieces and drawings. Escape cancels a gesture. Changing maps
          keeps your board. Boards last until you leave or refresh.
        </p>
        <label className="flex items-center gap-3 text-sm text-white/70">
          Map
          <select
            value={map.name}
            onChange={(event) => setMapName(event.target.value)}
            className="max-w-full rounded-lg border border-white/15 bg-tools-carbon px-3 py-3 text-white"
          >
            {TACTICS_MAPS.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </footer>
    </main>
  );
}
