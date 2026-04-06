import time

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.constants.common import TIMER_SECONDS, Team, DraftAction
from app.constants.striker_draft import STRIKER_SEQUENCE, STRIKER_POOL
from app.constants.tables import Table
from app.models.common import ReadyRequest
from app.models.striker_draft import (
    CreateStrikerDraftRoomRequest,
    StrikerDraftActionRequest,
    StrikerDraftPendingRequest,
)
from app.utils.supabase import generate_room_id, get_room, save_room
from app.utils.striker_draft import (
    cancel_timer,
    generate_random_awakenings,
    spawn_timer,
    timers,
)
from app.utils.ws import manager

router = APIRouter(prefix="/striker-draft")


@router.post("/rooms")
async def create_room(body: CreateStrikerDraftRoomRequest):
    if body.awakeningMode == "custom":
        if not body.customAwakenings or len(body.customAwakenings) != 2:
            raise HTTPException(status_code=400, detail="Exactly 2 custom awakenings required")
        awakenings = body.customAwakenings
    else:
        try:
            awakenings = generate_random_awakenings(body.bannedStarts)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    room_id = generate_room_id()
    state = {
        "roomId": room_id,
        "blueName": body.blueName.strip() or "Team A",
        "redName": body.redName.strip() or "Team B",
        "map": body.map,
        "awakenings": awakenings,
        "step": 0,
        "actions": [],
        "done": False,
        "readyBlue": False,
        "readyRed": False,
        "pendingBlue": None,
        "pendingRed": None,
        "stepStartedAt": None,
        "bannedStarts": body.bannedStarts,
    }
    await save_room(room_id, state, Table.STRIKER_DRAFTS)
    return state


@router.get("/rooms/{room_id}")
async def get_room_route(room_id: str):
    state = await get_room(room_id, Table.STRIKER_DRAFTS)
    if state is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return state


@router.post("/rooms/{room_id}/ready")
async def set_ready(room_id: str, body: ReadyRequest):
    state = await get_room(room_id, Table.STRIKER_DRAFTS)
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

    await save_room(room_id, updated, Table.STRIKER_DRAFTS)
    await manager.broadcast(room_id, updated)

    if updated["readyBlue"] and updated["readyRed"]:
        spawn_timer(room_id, updated["step"])

    return updated


@router.post("/rooms/{room_id}/pending")
async def set_pending(room_id: str, body: StrikerDraftPendingRequest):
    state = await get_room(room_id, Table.STRIKER_DRAFTS)
    if state is None:
        raise HTTPException(status_code=404, detail="Room not found")
    if body.side not in (Team.BLUE, Team.RED):
        raise HTTPException(status_code=400, detail="Invalid side")

    updated = {**state}
    if body.side == Team.BLUE:
        updated["pendingBlue"] = body.striker
    else:
        updated["pendingRed"] = body.striker

    await save_room(room_id, updated, Table.STRIKER_DRAFTS)
    await manager.broadcast(room_id, updated)
    return updated


@router.post("/rooms/{room_id}/action")
async def apply_action(room_id: str, body: StrikerDraftActionRequest):
    state = await get_room(room_id, Table.STRIKER_DRAFTS)
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
    if step >= len(STRIKER_SEQUENCE):
        raise HTTPException(status_code=400, detail="No more steps remaining")

    seq_step = STRIKER_SEQUENCE[step]

    if body.striker is None:
        if seq_step["action"] != DraftAction.BAN:
            raise HTTPException(status_code=400, detail="No-ban is only allowed on ban steps")
    else:
        if body.striker not in STRIKER_POOL:
            raise HTTPException(status_code=400, detail="Invalid striker")
        used_strikers = {a["striker"] for a in state["actions"] if a["striker"] is not None}
        if body.striker in used_strikers:
            raise HTTPException(status_code=400, detail="Striker already used")

    new_step = step + 1
    team_name = state["blueName"] if seq_step["team"] == Team.BLUE else state["redName"]
    new_actions = state["actions"] + [{"striker": body.striker, "team": team_name, "action": seq_step["action"]}]
    done = new_step >= len(STRIKER_SEQUENCE)

    updated = {
        **state,
        "step": new_step,
        "actions": new_actions,
        "done": done,
        "pendingBlue": None,
        "pendingRed": None,
        "stepStartedAt": None if done else time.time(),
    }
    await save_room(room_id, updated, Table.STRIKER_DRAFTS)

    cancel_timer(room_id)
    await manager.broadcast(room_id, updated)

    if not done:
        spawn_timer(room_id, new_step)

    return updated


@router.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(room_id: str, ws: WebSocket):
    await manager.connect(room_id, ws)
    try:
        state = await get_room(room_id, Table.STRIKER_DRAFTS)
        if state is not None:
            await ws.send_json(state)
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
