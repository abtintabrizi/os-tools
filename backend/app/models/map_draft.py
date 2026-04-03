from pydantic import BaseModel

from app.constants.common import Team


class CreateMapDraftRoomRequest(BaseModel):
    bestOf: str
    blueName: str
    redName: str
    maps: list[str]


class MapDraftActionRequest(BaseModel):
    map: str


class MapDraftPendingRequest(BaseModel):
    side: Team
    map: str | None = None
