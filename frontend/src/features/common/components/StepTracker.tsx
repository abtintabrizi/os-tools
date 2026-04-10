import { SequenceStep } from "@/features/common/types";
import { DraftAction } from "@/features/common/constants/constants";

export function StepTracker({
  step,
  sequence,
  done,
}: {
  step: number;
  sequence: SequenceStep[];
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {sequence.map((s, i) => {
        const base = "w-5 h-1 rounded-sm transition-colors duration-300";
        let color: string;
        if (i < step || done) {
          color =
            s.action === DraftAction.Ban
              ? "bg-tools-red/50"
              : "bg-tools-green/50";
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
