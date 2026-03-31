from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, room_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self.connections.setdefault(room_id, []).append(ws)

    def disconnect(self, room_id: str, ws: WebSocket) -> None:
        conns = self.connections.get(room_id, [])
        if ws in conns:
            conns.remove(ws)

    async def broadcast(self, room_id: str, data: dict) -> None:
        for ws in list(self.connections.get(room_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                pass


manager = ConnectionManager()
