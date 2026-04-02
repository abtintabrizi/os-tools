import asyncio
import random
import time

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from .constants import MIN_MAPS, SEQUENCES, TIMER_SECONDS
from .models import ActionRequest, CreateRoomRequest, PendingRequest, ReadyRequest
from .store import generate_room_id, get_room, save_room
from .ws import manager

router = APIRouter()


# Tracks the active auto-advance task per room
_timers: dict[str, asyncio.Task] = {}


def _cancel_timer(room_id: str) -> None:
    task = _timers.pop(room_id, None)
    if task and not task.done():
        task.cancel()


def _spawn_timer(room_id: str, step: int, delay: float = TIMER_SECONDS) -> None:
    _cancel_timer(room_id)
    _timers[room_id] = asyncio.create_task(_auto_advance(room_id, step, delay))


async def _auto_advance(room_id: str, expected_step: int, delay: float) -> None:
    try:
        await asyncio.sleep(delay)
    except asyncio.CancelledError:
        return

    state = await get_room(room_id)
    if state is None or state["done"] or state["step"] != expected_step:
        return

    sequence = SEQUENCES[state["bestOf"]]
    seq_step = sequence[expected_step]

    pending_key = "pendingBlue" if seq_step["team"] == "blue" else "pendingRed"
    chosen_map = state.get(pending_key)

    used_maps = {a["map"] for a in state["actions"]}
    available = [m for m in state["maps"] if m not in used_maps]
    if not available:
        return

    if not chosen_map or chosen_map not in available:
        chosen_map = random.choice(available)

    team_name = state["blueName"] if seq_step["team"] == "blue" else state["redName"]
    new_actions = state["actions"] + [{"map": chosen_map, "team": team_name, "action": seq_step["action"]}]
    new_step = expected_step + 1
    done = new_step >= len(sequence)

    updated = {
        **state,
        "step": new_step,
        "actions": new_actions,
        "done": done,
        "pendingBlue": None,
        "pendingRed": None,
        "stepStartedAt": None if done else time.time(),
    }

    await save_room(room_id, updated)
    await manager.broadcast(room_id, updated)

    if not done:
        _spawn_timer(room_id, new_step)


@router.get("/")
async def root():
    return {"message": "Backend running"}


@router.post("/rooms")
async def create_room(body: CreateRoomRequest):
    if len(body.maps) != MIN_MAPS:
        raise HTTPException(status_code=400, detail=f"Exactly {MIN_MAPS} maps required to draft")

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
    await save_room(room_id, state)
    return state


@router.get("/rooms/{room_id}")
async def get_room_route(room_id: str):
    state = await get_room(room_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return state


@router.post("/rooms/{room_id}/ready")
async def set_ready(room_id: str, body: ReadyRequest):
    state = await get_room(room_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Room not found")
    if body.side not in ("blue", "red"):
        raise HTTPException(status_code=400, detail="Invalid side")

    updated = {**state}
    if body.side == "blue":
        updated["readyBlue"] = True
    else:
        updated["readyRed"] = True

    if updated["readyBlue"] and updated["readyRed"]:
        updated["stepStartedAt"] = time.time()

    await save_room(room_id, updated)
    await manager.broadcast(room_id, updated)

    if updated["readyBlue"] and updated["readyRed"]:
        _spawn_timer(room_id, updated["step"])

    return updated


@router.post("/rooms/{room_id}/pending")
async def set_pending(room_id: str, body: PendingRequest):
    state = await get_room(room_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Room not found")
    if body.side not in ("blue", "red"):
        raise HTTPException(status_code=400, detail="Invalid side")

    updated = {**state}
    if body.side == "blue":
        updated["pendingBlue"] = body.map
    else:
        updated["pendingRed"] = body.map

    await save_room(room_id, updated)
    await manager.broadcast(room_id, updated)
    return updated


@router.post("/rooms/{room_id}/action")
async def apply_action(room_id: str, body: ActionRequest):
    state = await get_room(room_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Room not found")

    if not state.get("readyBlue") or not state.get("readyRed"):
        raise HTTPException(status_code=400, detail="Both teams must be ready before the draft can start")

    if state["done"]:
        raise HTTPException(status_code=400, detail="Draft is already complete")

    step = state["step"]
    currentSequence = SEQUENCES[state["bestOf"]]
    if step >= len(currentSequence):
        raise HTTPException(status_code=400, detail="No more steps remaining")

    if body.map not in state["maps"]:
        raise HTTPException(status_code=400, detail="Map not in pool")

    used_maps = {a["map"] for a in state["actions"]}
    if body.map in used_maps:
        raise HTTPException(status_code=400, detail="Map already used")

    seq_step = currentSequence[step]
    new_step = step + 1
    team_name = state["blueName"] if seq_step["team"] == "blue" else state["redName"]
    new_actions = state["actions"] + [{"map": body.map, "team": team_name, "action": seq_step["action"]}]
    done = new_step >= len(currentSequence)

    updated = {
        **state,
        "step": new_step,
        "actions": new_actions,
        "done": done,
        "pendingBlue": None,
        "pendingRed": None,
        "stepStartedAt": None if done else time.time(),
    }
    await save_room(room_id, updated)

    _cancel_timer(room_id)
    await manager.broadcast(room_id, updated)

    if not done:
        _spawn_timer(room_id, new_step)

    return updated


@router.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(room_id: str, ws: WebSocket):
    await manager.connect(room_id, ws)
    try:
        state = await get_room(room_id)
        if state is not None:
            await ws.send_json(state)
            # Re-spawn timer on reconnect if a step is in progress and no active task exists
            existing = _timers.get(room_id)
            if (
                not state.get("done")
                and state.get("readyBlue")
                and state.get("readyRed")
                and state.get("stepStartedAt") is not None
                and (not existing or existing.done())
            ):
                elapsed = time.time() - state["stepStartedAt"]
                remaining = max(0.0, TIMER_SECONDS - elapsed)
                _spawn_timer(room_id, state["step"], delay=remaining)
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room_id, ws)
