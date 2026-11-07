import { randomInt } from "node:crypto";
import { ORPCError } from "@orpc/server";
import {
  type Awakening,
  AwakeningMode,
  type CreateStrikerDraftRoomRequest,
  DraftType,
  type StrikerDraftState,
} from "@os-tools/shared";

import { ErrorCode } from "../constants/errorCode.js";
import { GameRuleError } from "../gameRuleError.js";
import { initialState } from "../utils/roomUtil.js";
import { getAvailableAwakenings } from "../utils/strikerDraftUtil.js";
import type { RoomManager } from "./roomManager.js";

export class StrikerDraftManager {
  public constructor(private readonly roomManager: RoomManager) {}

  public createRoom = async ({
    blueName,
    redName,
    map,
    awakeningMode,
    bannedStarts,
    customAwakenings,
  }: CreateStrikerDraftRoomRequest): Promise<StrikerDraftState> => {
    let awakenings: Awakening[];

    if (awakeningMode === AwakeningMode.Custom) {
      if (customAwakenings.length !== 2) {
        throw new ORPCError(ErrorCode.BadRequest, { message: "Exactly 2 custom awakenings required" });
      }

      awakenings = customAwakenings;
    } else {
      try {
        awakenings = this.generateRandomAwakenings(bannedStarts);
      } catch (error: unknown) {
        if (error instanceof GameRuleError) {
          throw new ORPCError(ErrorCode.BadRequest, { message: error.message, cause: error });
        }

        throw error;
      }
    }

    return this.roomManager.create(DraftType.StrikerDraft, (roomId): StrikerDraftState => {
      return {
        ...initialState(roomId, { blueName, redName }),
        map,
        awakenings,
        bannedStarts,
        awakeningMode,
      };
    });
  };

  private generateRandomAwakenings = (bannedStarts: readonly Awakening[]): Awakening[] => {
    const firstPool = getAvailableAwakenings(bannedStarts);
    const first = firstPool[randomInt(firstPool.length)]!;
    const secondPool = getAvailableAwakenings(bannedStarts, first);

    return [first, secondPool[randomInt(secondPool.length)]!];
  };
}
