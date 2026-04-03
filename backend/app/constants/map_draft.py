from enum import StrEnum

from app.constants.common import Team, DraftAction

BO3_SEQUENCE = [
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.RED, "action": DraftAction.BAN},
    {"team": Team.BLUE, "action": DraftAction.PICK},
    {"team": Team.RED, "action": DraftAction.PICK},
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.RED, "action": DraftAction.BAN},
]

BO1_SEQUENCE = [
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.RED, "action": DraftAction.PICK},
]


class Sequence(StrEnum):
    BO3 = "bo3"
    BO1 = "bo1"


SEQUENCE_MAPPING = {Sequence.BO3: BO3_SEQUENCE, Sequence.BO1: BO1_SEQUENCE}


MIN_MAPS = 7
