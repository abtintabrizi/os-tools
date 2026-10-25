import { GameMap, Team } from "@os-tools/shared";
import { useCallback, useEffect, useState } from "react";

import { HomeButton } from "../../common/components/NavButtons";
import { useToast } from "../../common/components/Toast";
import StrikerPalette from "../components/StrikerPalette";
import TacticsBoard from "../components/TacticsBoard";
import TacticsToolbar from "../components/TacticsToolbar";
import { DRAW_COLORS, TACTICS_MAPS } from "../constants";
import { initialBoard, useTacticsBoard } from "../hooks/useTacticsBoard";
import type { PlayingTeam, Tool } from "../types";
import { exportImage } from "../util/exportImage";

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
    document.title = "OS Tools — Tactics";

    return () => {
      document.title = "OS Tools";
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable]:not([contenteditable=false])")) {
        return;
      }
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && (key === "z" || (event.ctrlKey && key === "y"))) {
        event.preventDefault();
        setCancelVersion((value) => value + 1);
        if (key === "y" || event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const imageError = useCallback(
    () =>
      toast({
        message: "An image could not be loaded. Refresh the page to try again.",
        variant: "error",
      }),
    [toast],
  );

  return (
    <main aria-label="Tactics" className="grid h-dvh w-full grid-rows-[auto_minmax(0,1fr)_auto] gap-3 py-3">
      <div className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)_5rem] items-start gap-3 px-5">
        <div className="py-4.5">
          <HomeButton />
        </div>
        <div className="flex min-w-0 justify-center">
          <TacticsToolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            width={width}
            setWidth={setWidth}
            mapName={map.name}
            setMapName={setMapName}
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
        </div>
        <div aria-hidden="true" />
      </div>
      <div className="flex min-h-0 items-center justify-center" style={{ containerType: "size" }}>
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
      </div>
      <div className="mx-auto w-full max-w-7xl">
        <StrikerPalette team={team} setTeam={setTeam} onImageError={imageError} />
      </div>
    </main>
  );
}
