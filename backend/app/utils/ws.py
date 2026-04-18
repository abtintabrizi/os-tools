import time

from fastapi import WebSocket

from app.constants.common import Team


class ConnectionManager:
    def __init__(self) -> None:
        # room_id -> list of (WebSocket, side) tuples; side is "blue", "red", or "spectator"
        self.connections: dict[str, list[tuple[WebSocket, str]]] = {}

    async def connect(
        self, room_id: str, ws: WebSocket, side: str = Team.SPECTATOR
    ) -> None:
        await ws.accept()
        self.connections.setdefault(room_id, []).append((ws, side))

    def disconnect(self, room_id: str, ws: WebSocket) -> None:
        conns = self.connections.get(room_id, [])
        self.connections[room_id] = [(w, s) for w, s in conns if w is not ws]

    async def broadcast(
        self, room_id: str, data: dict, side: str | None = None
    ) -> None:
        payload = {**data, "serverTime": time.time()}
        for ws, conn_side in list(self.connections.get(room_id, [])):
            if side is not None and conn_side != side:
                continue
            try:
                await ws.send_json(payload)
            except Exception:
                pass


manager = ConnectionManager()
