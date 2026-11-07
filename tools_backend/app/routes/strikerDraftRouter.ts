import { implement } from "@orpc/server";
import { contract, DraftType } from "@os-tools/shared";

import type { RoomManager } from "../managers/roomManager.js";
import type { StrikerDraftManager } from "../managers/strikerDraftManager.js";

export function strikerDraftRouter(manager: StrikerDraftManager, rooms: RoomManager) {
  const procedure = implement(contract.strikerDraft);

  return procedure.router({
    createRoom: procedure.createRoom.handler(({ input }) => {
      return manager.createRoom(input);
    }),
    getRoom: procedure.getRoom.handler(({ input }) => {
      return rooms.get(DraftType.StrikerDraft, input);
    }),
    ready: procedure.ready.handler(({ input }) => {
      return rooms.ready(DraftType.StrikerDraft, input);
    }),
    setPending: procedure.setPending.handler(({ input }) => {
      return rooms.pending(DraftType.StrikerDraft, input);
    }),
    applyAction: procedure.applyAction.handler(({ input }) => {
      return rooms.action(DraftType.StrikerDraft, input);
    }),
  });
}
