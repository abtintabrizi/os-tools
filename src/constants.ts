import { SequenceStep } from "@/types"

export const ALL_MAPS = [
  "Ahten City",
  "Aimi's App",
  "Atlas's Lab",
  "Clarion Test Chamber",
  "Demon Dais",
  "Gates of Obscura",
  "Inky's Splash Zone",
  "Night Market",
  "Oni Village",
  "Taiko Temple",
]

// Bo3: Blue bans → Red bans → Blue picks G1 → Red picks G2 → remaining = G3 decider
export const SEQUENCE: SequenceStep[] = [
  { team: 'A', action: 'ban' },
  { team: 'B', action: 'ban' },
  { team: 'A', action: 'pick' },
  { team: 'B', action: 'pick' },
]
