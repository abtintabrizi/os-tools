import { AWAKENING_CONFLICTS as conflicts } from "@os-tools/shared/constants/awakenings";

export { CURRENT_AWAKENING_POOL } from "@os-tools/shared/constants/awakenings";
export { ALL_AWAKENINGS } from "@os-tools/shared/constants/awakeningNames";
export { TIMER_SECONDS, COUNTDOWN_SECONDS } from "@os-tools/shared/constants/timing";

export const AWAKENING_CONFLICTS: Readonly<Record<string, readonly string[]>> = conflicts;
