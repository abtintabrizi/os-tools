from pydantic import BaseModel

from app.constants.common import Team


class CreateStrikerDraftRoomRequest(BaseModel):
    blueName: str
    redName: str
    map: str
    awakeningMode: str  # "random" or "custom"
    bannedStarts: list[str] | None = []
    customAwakenings: list[str] | None = None


class StrikerDraftActionRequest(BaseModel):
    striker: str | None = None
    step: int


class StrikerDraftPendingRequest(BaseModel):
    side: Team
    striker: str | None = None
