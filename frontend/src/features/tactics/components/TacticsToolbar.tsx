import { ArrowUpRight, Download, Hand, Pencil, Redo2, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { DRAW_COLORS } from "../constants";
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
};

const buttonClass =
  "flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30";

export default function TacticsToolbar(props: Props) {
  const tools = [
    { tool: "move", label: "Move", icon: Hand },
    { tool: "arrow", label: "Arrow", icon: ArrowUpRight },
    { tool: "freehand", label: "Freehand", icon: Pencil },
    { tool: "delete", label: "Delete", icon: Trash2 },
  ] as const;

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/7 bg-tools-carbon p-3"
      aria-label="Whiteboard tools"
      role="toolbar"
    >
      {tools.map(({ tool, label, icon: Icon }) => (
        <button
          key={tool}
          className={`${buttonClass} ${props.tool === tool ? "bg-tools-gold/20 text-tools-gold" : "text-white/70"}`}
          aria-pressed={props.tool === tool}
          onClick={() => props.setTool(tool)}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
      <div className="mx-2 flex items-center gap-2" role="group" aria-label="Drawing color">
        {DRAW_COLORS.map((color, index) => (
          <button
            key={color}
            aria-label={`${["White", "Blue", "Red", "Yellow"][index]} drawing color`}
            aria-pressed={props.color === color}
            onClick={() => props.setColor(color)}
            className={`h-6 w-6 rounded-full border-2 ${props.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-tools-carbon" : "border-white/20"}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-white/60">
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
      <button className={buttonClass} disabled={!props.canUndo} onClick={props.undo} title="Undo (Ctrl/Cmd+Z)">
        <Undo2 size={16} />
        Undo
      </button>
      <button
        className={buttonClass}
        disabled={!props.canRedo}
        onClick={props.redo}
        title="Redo (Ctrl/Cmd+Shift+Z or Ctrl+Y)"
      >
        <Redo2 size={16} />
        Redo
      </button>
      <button className={buttonClass} onClick={props.reset}>
        <RotateCcw size={16} />
        Reset
      </button>
      <button className={`${buttonClass} text-tools-gold`} disabled={props.saving} onClick={props.save}>
        <Download size={16} />
        {props.saving ? "Saving…" : "Save image"}
      </button>
    </div>
  );
}
