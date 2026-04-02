export default function ResultCard({
  value,
  type,
  label,
  status = "filled",
}: {
  value?: string;
  type: "ban" | "pick";
  label: string;
  status?: "filled" | "active" | "pending";
}) {
  const slotClass = [
    "border rounded-lg py-2.5 px-3 min-h-11 flex items-center gap-2 relative transition-all duration-300",
    status === "filled" && type === "ban"
      ? "border-tools-red/25 bg-tools-red/6"
      : status === "filled" && type === "pick"
        ? "border-tools-green/25 bg-tools-green/6"
        : status === "active" && type === "ban"
          ? "border-tools-red/40 bg-tools-red/4 animate-[pulseBorder_2s_infinite]"
          : status === "active" && type === "pick"
            ? "border-tools-green/40 bg-tools-green/4 animate-[pulseBorder_2s_infinite]"
            : "bg-tools-graphite border-white/7 opacity-40",
  ].join(" ");

  const iconClass = [
    "w-5 h-5 rounded flex items-center justify-center text-xs shrink-0",
    status === "pending"
      ? "bg-white/5 text-white/20"
      : type === "ban"
        ? "bg-tools-red/15 text-tools-red-light"
        : "bg-tools-green/12 text-tools-green-light",
  ].join(" ");

  const valueClass =
    status === "filled"
      ? type === "ban"
        ? "text-sm font-semibold flex-1 text-tools-red-light line-through decoration-tools-red/40"
        : "text-sm font-semibold flex-1 text-tools-green-light"
      : "text-sm font-semibold flex-1 opacity-30";

  return (
    <div className={slotClass}>
      <span className={iconClass}>{type === "ban" ? "✕" : "✓"}</span>
      <span className={valueClass}>{value ?? "—"}</span>
      <span className="text-xs font-mono tracking-widest uppercase opacity-50">
        {label}
      </span>
    </div>
  );
}
