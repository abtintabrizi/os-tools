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


class SetGame1FirstPickRequest(BaseModel):
    firstPick: str


class SetStrikerRoomsRequest(BaseModel):
    rooms: dict[str, str]
    bannedAwakenings: list[str]
