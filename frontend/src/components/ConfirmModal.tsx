import type { ActionType } from "@/features/map-drafter/types";

interface Props {
  map: string;
  action: ActionType;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ map, action, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-100 bg-black/75 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-tools-bg2 border border-tools-border-bright rounded-2xl p-8 max-w-90 w-[90%] text-center">
        <div
          className={`text-[10px] font-mono tracking-[0.2em] uppercase mb-3 ${
            action === "ban" ? "text-tools-red-light" : "text-tools-green-light"
          }`}
        >
          {action.toUpperCase()}
        </div>
        <div className="text-2xl font-extrabold mb-6 text-tools-text">{map}</div>
        <div className="flex gap-2.5">
          <button
            className="flex-1 py-3 px-3 rounded-lg border border-tools-border font-head text-sm font-bold transition-all duration-150 bg-transparent text-tools-text-muted hover:text-tools-text hover:border-tools-border-bright"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`flex-1 py-3 px-3 rounded-lg border font-head text-sm font-bold transition-all duration-150 ${
              action === "ban"
                ? "bg-tools-red/15 text-tools-red-light border-tools-red/30 hover:bg-tools-red/25"
                : "bg-tools-green/12 text-tools-green-light border-tools-green/30 hover:bg-tools-green/22"
            }`}
            onClick={onConfirm}
          >
            {action === "ban" ? "Ban map" : "Pick map"}
          </button>
        </div>
      </div>
    </div>
  );
}
