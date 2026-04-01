from pydantic import BaseModel


class CreateRoomRequest(BaseModel):
    bestOf: str
    blueName: str
    redName: str
    maps: list[str]


class ActionRequest(BaseModel):
    map: str


class ReadyRequest(BaseModel):
    side: str


class PendingRequest(BaseModel):
    side: str
    map: str | None = None
