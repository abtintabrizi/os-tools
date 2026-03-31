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
      <div className="bg-(--bg2) border border-(--border-bright) rounded-2xl p-8 max-w-90 w-[90%] text-center">
        <div
          className={`text-[10px] font-mono tracking-[0.2em] uppercase mb-3 ${
            action === "ban" ? "text-[#f87171]" : "text-[#4ade80]"
          }`}
        >
          {action.toUpperCase()}
        </div>
        <div className="text-2xl font-extrabold mb-6 text-(--text)">{map}</div>
        <div className="flex gap-2.5">
          <button
            className="flex-1 py-3 px-3 rounded-lg border border-(--border) font-head text-sm font-bold transition-all duration-150 bg-transparent text-(--text-muted) hover:text-(--text) hover:border-(--border-bright)"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`flex-1 py-3 px-3 rounded-lg border font-head text-sm font-bold transition-all duration-150 ${
              action === "ban"
                ? "bg-[rgba(239,68,68,0.15)] text-[#f87171] border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.25)]"
                : "bg-[rgba(34,197,94,0.12)] text-[#4ade80] border-[rgba(34,197,94,0.3)] hover:bg-[rgba(34,197,94,0.22)]"
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
