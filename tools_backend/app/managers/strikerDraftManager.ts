import { randomInt } from "node:crypto";
import {
  type Awakening,
  AwakeningMode,
  type CreateStrikerDraftRoomRequest,
  DraftType,
  type StrikerDraftState,
} from "@os-tools/shared";
import createError from "http-errors";

import { initialState } from "../utils/roomUtil.js";
import { getAvailableAwakenings } from "../utils/strikerDraftUtil.js";
import type { RoomManager } from "./roomManager.js";

export class StrikerDraftManager {
  public constructor(private readonly roomManager: RoomManager) {}

  public createRoom = async (body: CreateStrikerDraftRoomRequest): Promise<StrikerDraftState> => {
    let awakenings: Awakening[];

    if (body.awakeningMode === AwakeningMode.Custom) {
      if (body.customAwakenings.length !== 2) {
        throw createError.BadRequest("Exactly 2 custom awakenings required");
      }

      awakenings = body.customAwakenings;
    } else {
      awakenings = this.generateRandomAwakenings(body.bannedStarts);
    }

    return this.roomManager.create(DraftType.StrikerDraft, (roomId): StrikerDraftState => {
      return {
        ...initialState(roomId, body),
        map: body.map,
        awakenings,
        bannedStarts: body.bannedStarts,
        awakeningMode: body.awakeningMode,
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
