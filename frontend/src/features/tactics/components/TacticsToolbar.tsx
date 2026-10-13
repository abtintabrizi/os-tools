import { ArrowUpRight, Download, Hand, LoaderCircle, Pencil, Redo2, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { DRAW_COLORS, TACTICS_MAPS } from "../constants";
import type { Tool } from "../types";

type Props = {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  width: number;
  setWidth: (width: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  save: () => void;
  saving: boolean;
  mapName: string;
  setMapName: (name: string) => void;
};

const buttonClass =
  "flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2 py-2 text-sm transition-colors enabled:hover:bg-white/10 disabled:cursor-default! disabled:opacity-30";

export default function TacticsToolbar(props: Props) {
  const tools = [
    { tool: "move", label: "Move", icon: Hand },
    { tool: "arrow", label: "Arrow", icon: ArrowUpRight },
    { tool: "freehand", label: "Freehand", icon: Pencil },
    { tool: "delete", label: "Delete", icon: Trash2 },
  ] as const;

  return (
    <div
      className="flex w-max max-w-full flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/7 bg-tools-carbon p-2"
      aria-label="Whiteboard tools"
      role="toolbar"
    >
      {tools.map(({ tool, label, icon: Icon }) => (
        <button
          key={tool}
          className={`${buttonClass} ${props.tool === tool ? "bg-tools-gold/20 text-tools-gold disabled:opacity-100!" : "text-white/70"}`}
          aria-pressed={props.tool === tool}
          disabled={props.tool === tool}
          title={label}
          aria-label={label}
          onClick={() => props.setTool(tool)}
        >
          <Icon size={16} />
          <span>{label}</span>
        </button>
      ))}
      <div className="mx-2 flex shrink-0 items-center gap-2" role="group" aria-label="Drawing color">
        {DRAW_COLORS.map((color, index) => (
          <button
            key={color}
            aria-label={`${["White", "Blue", "Red", "Yellow"][index]} drawing color`}
            aria-pressed={props.color === color}
            onClick={() => props.setColor(color)}
            className={`h-6 w-6 rounded-full border-2 ${props.color === color ? "cursor-default! ring-2 ring-white ring-offset-2 ring-offset-tools-carbon" : "border-white/20"}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <label className="flex shrink-0 items-center gap-2 text-sm text-white/60">
        Width
        <select
          className="rounded-lg border border-white/10 bg-tools-graphite p-2 text-white"
          value={props.width}
          onChange={(event) => props.setWidth(Number(event.target.value))}
        >
          <option value={3}>Thin</option>
          <option value={6}>Medium</option>
          <option value={10}>Thick</option>
        </select>
      </label>
      <label className="flex min-w-20 items-center gap-2 text-sm text-white/60">
        Map
        <select
          value={props.mapName}
          onChange={(event) => props.setMapName(event.target.value)}
          className="min-w-0 w-52 max-w-full rounded-lg border border-white/10 bg-tools-graphite p-2 text-white"
        >
          {TACTICS_MAPS.map((map) => (
            <option key={map.name} value={map.name}>
              {map.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className={buttonClass}
        disabled={!props.canUndo}
        onClick={props.undo}
        title="Undo (Ctrl/Cmd+Z)"
        aria-label="Undo"
      >
        <Undo2 size={16} />
      </button>
      <button
        className={buttonClass}
        disabled={!props.canRedo}
        onClick={props.redo}
        title="Redo (Ctrl/Cmd+Shift+Z or Ctrl+Y)"
        aria-label="Redo"
      >
        <Redo2 size={16} />
      </button>
      <button className={buttonClass} onClick={props.reset} title="Reset board" aria-label="Reset board">
        <RotateCcw size={16} />
      </button>
      <button
        className={`${buttonClass} text-tools-gold`}
        disabled={props.saving}
        onClick={props.save}
        title={props.saving ? "Saving image…" : "Save image"}
        aria-label={props.saving ? "Saving image" : "Save image"}
        aria-busy={props.saving}
      >
        {props.saving ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}
      </button>
    </div>
  );
}
