from pydantic import BaseModel


class ReadyRequest(BaseModel):
    side: str
