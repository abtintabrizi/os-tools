from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from .constants import SEQUENCES
from .models import ActionRequest, CreateRoomRequest
from .store import generate_room_id, get_room, save_room
from .ws import manager

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Backend running"}


@router.post("/rooms")
async def create_room(body: CreateRoomRequest):
    minMaps = len(SEQUENCES[body.bestOf]) + 1
    if len(body.maps) < minMaps:
        raise HTTPException(status_code=400, detail=f"At least {minMaps} maps required for a {body.bestOf} draft")

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
    }
    await save_room(room_id, state)
    return state


@router.get("/rooms/{room_id}")
async def get_room_route(room_id: str):
    state = await get_room(room_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return state


@router.post("/rooms/{room_id}/action")
async def apply_action(room_id: str, body: ActionRequest):
    state = await get_room(room_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Room not found")

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

    updated = {**state, "step": new_step, "actions": new_actions, "done": done}
    await save_room(room_id, updated)

    await manager.broadcast(room_id, updated)
    return updated


@router.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(room_id: str, ws: WebSocket):
    await manager.connect(room_id, ws)
    try:
        state = await get_room(room_id)
        if state is not None:
            await ws.send_json(state)
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room_id, ws)
