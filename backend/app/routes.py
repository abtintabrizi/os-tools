from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from .constants import BO3_SEQUENCE
from .models import ActionRequest, CreateRoomRequest
from .store import generate_room_id, rooms
from .ws import manager

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Backend running"}


@router.post("/rooms")
async def create_room(body: CreateRoomRequest):
    if len(body.maps) < 5:
        raise HTTPException(
            status_code=400, detail="At least 5 maps required for a Bo3 draft"
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
    }
    rooms[room_id] = state
    return state


@router.get("/rooms/{room_id}")
async def get_room(room_id: str):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    return rooms[room_id]


@router.post("/rooms/{room_id}/action")
async def apply_action(room_id: str, body: ActionRequest):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    state = rooms[room_id]

    if state["done"]:
        raise HTTPException(status_code=400, detail="Draft is already complete")

    step = state["step"]
    if step >= len(BO3_SEQUENCE):
        raise HTTPException(status_code=400, detail="No more steps remaining")

    if body.map not in state["maps"]:
        raise HTTPException(status_code=400, detail="Map not in pool")

    used_maps = {a["map"] for a in state["actions"]}
    if body.map in used_maps:
        raise HTTPException(status_code=400, detail="Map already used")

    seq_step = BO3_SEQUENCE[step]
    new_step = step + 1
    new_actions = state["actions"] + [
        {"map": body.map, "team": seq_step["team"], "action": seq_step["action"]}
    ]
    done = new_step >= len(BO3_SEQUENCE)

    updated = {**state, "step": new_step, "actions": new_actions, "done": done}
    rooms[room_id] = updated

    await manager.broadcast(room_id, updated)
    return updated


@router.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(room_id: str, ws: WebSocket):
    await manager.connect(room_id, ws)
    try:
        if room_id in rooms:
            await ws.send_json(rooms[room_id])
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room_id, ws)
