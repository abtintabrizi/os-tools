from pydantic import BaseModel


class CreateMapDraftRoomRequest(BaseModel):
    bestOf: str
    blueName: str
    redName: str
    maps: list[str]


class MapDraftActionRequest(BaseModel):
    map: str


class MapDraftPendingRequest(BaseModel):
    side: str
    map: str | None = None
