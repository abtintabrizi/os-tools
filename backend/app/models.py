from pydantic import BaseModel


class CreateRoomRequest(BaseModel):
    blueName: str
    redName: str
    maps: list[str]


class ActionRequest(BaseModel):
    map: str
