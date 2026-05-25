from pydantic import BaseModel

from app.constants.common import Team


class CreateMapDraftRoomRequest(BaseModel):
    bestOf: str
    blueName: str
    redName: str
    maps: list[str]


class MapDraftActionRequest(BaseModel):
    map: str
    step: int


class MapDraftPendingRequest(BaseModel):
    side: Team
    map: str | None = None


class SetStrikerRoomRequest(BaseModel):
    map: str
    roomId: str
    firstPick: str
    bannedAwakenings: list[str]
