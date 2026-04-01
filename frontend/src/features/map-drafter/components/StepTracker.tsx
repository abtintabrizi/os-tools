import { SEQUENCE_MAP } from "@/features/map-drafter/constants";
import { SequenceKey } from "@/features/map-drafter/types";

export function StepTracker({
  step,
  sequence,
  done,
}: {
  step: number;
  sequence: SequenceKey;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {SEQUENCE_MAP[sequence].map((s, i) => {
        const base = "w-5 h-1 rounded-sm transition-colors duration-300";
        let color: string;
        if (i < step || done) {
          color = s.action === "ban" ? "bg-tools-red/50" : "bg-tools-green/50";
        } else if (i === step && !done) {
          color = "bg-tools-gold";
        } else {
          color = "bg-tools-graphite";
        }
        return <span key={i} className={`${base} ${color}`} />;
      })}
    </div>
  );
}
