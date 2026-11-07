import { randomInt } from "node:crypto";

import { RequestError } from "../utils/requestError.js";
import { initialState } from "../utils/roomHelper.js";
import type { CreateStrikerDraftRoomRequest, StrikerDraftState } from "../models/strikerDraft.js";
import type { RoomState } from "../models/room.js";
import { getAvailableAwakenings } from "../utils/strikerDraft.js";
import type { RoomManager } from "./roomManager.js";

export class StrikerDraftManager {
  public constructor(private readonly roomManager: RoomManager) {}

  public createRoom = async (body: CreateStrikerDraftRoomRequest): Promise<RoomState> => {
    let awakenings: string[];

    if (body.awakeningMode === "custom") {
      if (body.customAwakenings?.length !== 2) throw new RequestError(400, "Exactly 2 custom awakenings required");

      awakenings = body.customAwakenings;
    } else awakenings = this.generateRandomAwakenings(body.bannedStarts);

    return this.roomManager.create("striker-draft", (roomId): StrikerDraftState => ({
      ...initialState(roomId, body),
      map: body.map,
      awakenings,
      bannedStarts: body.bannedStarts,
      awakeningMode: body.awakeningMode,
    }));
  };

  private generateRandomAwakenings = (bannedStarts: readonly string[] | null): string[] => {
    const firstPool = getAvailableAwakenings(bannedStarts);
    const first = firstPool[randomInt(firstPool.length)]!;
    const secondPool = getAvailableAwakenings(bannedStarts, first);

    return [first, secondPool[randomInt(secondPool.length)]!];
  };
}
