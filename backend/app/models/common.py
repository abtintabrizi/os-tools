from pydantic import BaseModel

from app.constants.common import Team


class ReadyRequest(BaseModel):
    side: Team
