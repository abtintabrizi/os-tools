import { ORPCError } from "@orpc/server";
import {
  type CreateMapDraftRoomRequest,
  DraftType,
  type MapDraftState,
  MIN_MAPS,
  type RoomRequest,
  SEQUENCE_MAPPING,
  type SetStrikerRoomRequest,
} from "@os-tools/shared";

import { ErrorCode } from "../constants/errorCode.js";
import { initialState } from "../utils/roomUtil.js";
import type { RoomManager } from "./roomManager.js";

export class MapDraftManager {
  public constructor(private readonly roomManager: RoomManager) {}

  public createRoom = async ({
    bestOf,
    blueName,
    redName,
    maps,
  }: CreateMapDraftRoomRequest): Promise<MapDraftState> => {
    if (maps.length !== MIN_MAPS) {
      throw new ORPCError(ErrorCode.BadRequest, { message: `Exactly ${MIN_MAPS} maps required to draft` });
    }

    if (!Object.hasOwn(SEQUENCE_MAPPING, bestOf)) {
      throw new ORPCError(ErrorCode.BadRequest, { message: "Invalid draft format" });
    }

    return this.roomManager.create(DraftType.MapDraft, (roomId): MapDraftState => {
      return {
        ...initialState(roomId, { blueName, redName }),
        maps,
        bestOf,
        strikerLobbies: null,
        bannedAwakenings: null,
      };
    });
  };

  public linkStrikerRoom = async ({
    roomId,
    map,
    strikerRoomId,
    firstPick,
    bannedAwakenings,
  }: RoomRequest & SetStrikerRoomRequest): Promise<MapDraftState> => {
    return this.roomManager.update(DraftType.MapDraft, roomId, (state) => {
      const existing = state.strikerLobbies ?? {};

      if (Object.hasOwn(existing, map)) {
        throw new ORPCError(ErrorCode.BadRequest, { message: "Room already set for this map" });
      }

      if (!state.bannedAwakenings?.length) {
        state.bannedAwakenings = bannedAwakenings;
      }

      state.strikerLobbies = { ...existing, [map]: { roomId: strikerRoomId, firstPick } };
    });
  };
}
