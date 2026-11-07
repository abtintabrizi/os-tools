import { MIN_MAPS, SEQUENCE_MAPPING } from "../constants/mapDraft.js";
import { RequestError } from "../utils/requestError.js";
import { initialState } from "../utils/roomHelper.js";
import type { CreateMapDraftRoomRequest, MapDraftState, Sequence, SetStrikerRoomRequest } from "../models/mapDraft.js";
import type { RoomState } from "../models/room.js";
import type { RoomManager } from "./roomManager.js";

export class MapDraftManager {
  public constructor(private readonly roomManager: RoomManager) {}

  public createRoom = async (body: CreateMapDraftRoomRequest): Promise<RoomState> => {
    if (body.maps.length !== MIN_MAPS) throw new RequestError(400, `Exactly ${MIN_MAPS} maps required to draft`);

    if (!Object.hasOwn(SEQUENCE_MAPPING, body.bestOf)) throw new RequestError(400, "Invalid draft format");

    return this.roomManager.create("map-draft", (roomId): MapDraftState => ({
      ...initialState(roomId, body),
      maps: body.maps,
      bestOf: body.bestOf as Sequence,
      strikerLobbies: null,
      bannedAwakenings: null,
    }));
  };

  public linkStrikerRoom = async (roomId: string, body: SetStrikerRoomRequest): Promise<RoomState> => {
    return this.roomManager.update("map-draft", roomId, (room) => {
      const state = room as MapDraftState;
      const existing = state.strikerLobbies ?? {};

      if (Object.hasOwn(existing, body.map)) throw new RequestError(400, "Room already set for this map");

      if (!state.bannedAwakenings?.length) state.bannedAwakenings = body.bannedAwakenings;

      state.strikerLobbies = { ...existing, [body.map]: { roomId: body.roomId, firstPick: body.firstPick } };
    });
  };
}
