import { SequenceStep } from "@/features/map-drafter/types";

export const BO3_SEQUENCE: SequenceStep[] = [
  { team: 'A', action: 'ban' },
  { team: 'B', action: 'ban' },
  { team: 'B', action: 'pick' },
  { team: 'A', action: 'pick' },
  { team: 'A', action: 'ban' },
  { team: 'B', action: 'pick' },
]

export const BO1_SEQUENCE: SequenceStep[] = [
  { team: 'A', action: 'ban' },
  { team: 'A', action: 'ban' },
  { team: 'A', action: 'ban' },
  { team: 'B', action: 'pick' },
]