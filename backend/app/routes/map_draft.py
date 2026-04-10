import logging
import time

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.constants.common import TIMER_SECONDS, Team
from app.constants.map_draft import MIN_MAPS, SEQUENCE_MAPPING
from app.constants.tables import Table
from app.models.common import ReadyRequest
from app.models.map_draft import (
    MapDraftActionRequest,
    CreateMapDraftRoomRequest,
    MapDraftPendingRequest,
)
from app.utils.supabase import generate_room_id, get_room, save_room
from app.utils.map_draft import (
    append_decider,
    cancel_timer,
    get_room_lock,
    spawn_timer,
    timers,
)
from app.utils.ws import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/map-draft")


@router.post("/rooms")
async def create_room(body: CreateMapDraftRoomRequest):
    if len(body.maps) != MIN_MAPS:
        raise HTTPException(
            status_code=400, detail=f"Exactly {MIN_MAPS} maps required to draft"
        )

    room_id = generate_room_id()
    state = {
        "roomId": room_id,
        "blueName": body.blueName.strip() or "Team A",
        "redName": body.redName.strip() or "Team B",
        "maps": body.maps,
        "step": 0,
        "actions": [],
        "done": False,
        "bestOf": body.bestOf,
        "readyBlue": False,
        "readyRed": False,
        "pendingBlue": None,
        "pendingRed": None,
        "stepStartedAt": None,
    }
    await save_room(room_id, state, Table.MAP_DRAFTS)
    logger.info(
        "[room=%s] Room created: blue=%s, red=%s, bestOf=%s, maps=%s",
        room_id,
        state["blueName"],
        state["redName"],
        body.bestOf,
        body.maps,
    )
    return state


@router.get("/rooms/{room_id}")
async def get_room_route(room_id: str):
    state = await get_room(room_id, Table.MAP_DRAFTS)
    if state is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return state


@router.post("/rooms/{room_id}/ready")
async def set_ready(room_id: str, body: ReadyRequest):
    state = await get_room(room_id, Table.MAP_DRAFTS)
    if state is None:
        raise HTTPException(status_code=404, detail="Room not found")
    if body.side not in (Team.BLUE, Team.RED):
        raise HTTPException(status_code=400, detail="Invalid side")

    updated = {**state}
    if body.side == Team.BLUE:
        updated["readyBlue"] = True
    else:
        updated["readyRed"] = True

    if updated["readyBlue"] and updated["readyRed"]:
        updated["stepStartedAt"] = time.time()

    await save_room(room_id, updated, Table.MAP_DRAFTS)
    await manager.broadcast(room_id, updated)
    logger.info("[room=%s] [side=%s] Ready", room_id, body.side)

    if updated["readyBlue"] and updated["readyRed"]:
        spawn_timer(room_id, updated["step"])

    return updated


@router.post("/rooms/{room_id}/pending")
async def set_pending(room_id: str, body: MapDraftPendingRequest):
    if body.side not in (Team.BLUE, Team.RED):
        raise HTTPException(status_code=400, detail="Invalid side")

    async with get_room_lock(room_id):
        state = await get_room(room_id, Table.MAP_DRAFTS)
        if state is None:
            raise HTTPException(status_code=404, detail="Room not found")

        updated = {**state}
        if body.side == Team.BLUE:
            updated["pendingBlue"] = body.map
        else:
            updated["pendingRed"] = body.map

        await save_room(room_id, updated, Table.MAP_DRAFTS)

    await manager.broadcast(room_id, updated, side=body.side)
    return updated


@router.post("/rooms/{room_id}/action")
async def apply_action(room_id: str, body: MapDraftActionRequest):
    async with get_room_lock(room_id):
        state = await get_room(room_id, Table.MAP_DRAFTS)
        if state is None:
            raise HTTPException(status_code=404, detail="Room not found")

        if not state.get("readyBlue") or not state.get("readyRed"):
            raise HTTPException(
                status_code=400,
                detail="Both teams must be ready before the draft can start",
            )

        if state["done"]:
            raise HTTPException(status_code=400, detail="Draft is already complete")

        step = state["step"]
        currentSequence = SEQUENCE_MAPPING[state["bestOf"]]
        if step >= len(currentSequence):
            raise HTTPException(status_code=400, detail="No more steps remaining")

        if body.map not in state["maps"]:
            raise HTTPException(status_code=400, detail="Map not in pool")

        used_maps = {a["map"] for a in state["actions"]}
        if body.map in used_maps:
            raise HTTPException(status_code=400, detail="Map already used")

        seq_step = currentSequence[step]
        new_step = step + 1
        team_name = (
            state["blueName"] if seq_step["team"] == Team.BLUE else state["redName"]
        )
        logger.info(
            "[room=%s] [side=%s] [step=%d] User action: %s -> %s",
            room_id,
            seq_step["team"],
            step,
            seq_step["action"],
            body.map,
        )
        new_actions = state["actions"] + [
            {"map": body.map, "team": team_name, "action": seq_step["action"]}
        ]
        done = new_step >= len(currentSequence)
        if done:
            new_actions = append_decider(state["maps"], new_actions, state["bestOf"])

        updated = {
            **state,
            "step": new_step,
            "actions": new_actions,
            "done": done,
            "pendingBlue": None,
            "pendingRed": None,
            "stepStartedAt": None if done else time.time(),
        }
        cancel_timer(room_id)
        await save_room(room_id, updated, Table.MAP_DRAFTS)

    await manager.broadcast(room_id, updated)

    if not done:
        spawn_timer(room_id, new_step)

    return updated


@router.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(room_id: str, ws: WebSocket):
    side = ws.query_params.get("side", Team.SPECTATOR)
    await manager.connect(room_id, ws, side)
    try:
        state = await get_room(room_id, Table.MAP_DRAFTS)
        if state is not None:
            masked_state = {
                **state,
                "pendingBlue": state.get("pendingBlue") if side == Team.BLUE else None,
                "pendingRed": state.get("pendingRed") if side == Team.RED else None,
            }
            await ws.send_json(masked_state)
            # Re-spawn timer on reconnect if a step is in progress and no active task exists
            existing = timers.get(room_id)
            if (
                not state.get("done")
                and state.get("readyBlue")
                and state.get("readyRed")
                and state.get("stepStartedAt") is not None
                and (not existing or existing.done())
            ):
                elapsed = time.time() - state["stepStartedAt"]
                remaining = max(0.0, TIMER_SECONDS - elapsed)
                spawn_timer(room_id, state["step"], delay=remaining)
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room_id, ws)
