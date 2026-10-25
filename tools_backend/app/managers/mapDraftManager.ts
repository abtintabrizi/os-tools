import {
  type CreateMapDraftRoomRequest,
  DraftType,
  type MapDraftState,
  MIN_MAPS,
  SEQUENCE_MAPPING,
  type SetStrikerRoomRequest,
} from "@os-tools/shared";
import createError from "http-errors";

import { initialState } from "../utils/roomUtil.js";
import type { RoomManager } from "./roomManager.js";

export class MapDraftManager {
  public constructor(private readonly roomManager: RoomManager) {}

  public createRoom = async (body: CreateMapDraftRoomRequest): Promise<MapDraftState> => {
    if (body.maps.length !== MIN_MAPS) {
      throw createError.BadRequest(`Exactly ${MIN_MAPS} maps required to draft`);
    }

    if (!Object.hasOwn(SEQUENCE_MAPPING, body.bestOf)) {
      throw createError.BadRequest("Invalid draft format");
    }

    return this.roomManager.create(DraftType.MapDraft, (roomId): MapDraftState => {
      return {
        ...initialState(roomId, body),
        maps: body.maps,
        bestOf: body.bestOf,
        strikerLobbies: null,
        bannedAwakenings: null,
      };
    });
  };

  public linkStrikerRoom = async (roomId: string, body: SetStrikerRoomRequest): Promise<MapDraftState> => {
    return this.roomManager.update(DraftType.MapDraft, roomId, (state) => {
      const existing = state.strikerLobbies ?? {};

      if (Object.hasOwn(existing, body.map)) {
        throw createError.BadRequest("Room already set for this map");
      }

      if (!state.bannedAwakenings?.length) {
        state.bannedAwakenings = body.bannedAwakenings;
      }

      state.strikerLobbies = { ...existing, [body.map]: { roomId: body.roomId, firstPick: body.firstPick } };
    });
  };
}
