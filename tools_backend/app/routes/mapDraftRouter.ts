import { implement } from "@orpc/server";
import { contract, DraftType } from "@os-tools/shared";

import type { MapDraftManager } from "../managers/mapDraftManager.js";
import type { RoomManager } from "../managers/roomManager.js";

export function mapDraftRouter(manager: MapDraftManager, rooms: RoomManager) {
  const procedure = implement(contract.mapDraft);

  return procedure.router({
    createRoom: procedure.createRoom.handler(({ input }) => {
      return manager.createRoom(input);
    }),
    getRoom: procedure.getRoom.handler(({ input }) => {
      return rooms.get(DraftType.MapDraft, input);
    }),
    ready: procedure.ready.handler(({ input }) => {
      return rooms.ready(DraftType.MapDraft, input);
    }),
    setPending: procedure.setPending.handler(({ input }) => {
      return rooms.pending(DraftType.MapDraft, input);
    }),
    applyAction: procedure.applyAction.handler(({ input }) => {
      return rooms.action(DraftType.MapDraft, input);
    }),
    linkStrikerRoom: procedure.linkStrikerRoom.handler(({ input }) => {
      return manager.linkStrikerRoom(input);
    }),
  });
}
