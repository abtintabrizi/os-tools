from enum import StrEnum

from app.constants.common import Team, DraftAction

BO3EU_SEQUENCE = [
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.RED, "action": DraftAction.BAN},
    {"team": Team.RED, "action": DraftAction.PICK, "game_num": 1},
    {"team": Team.BLUE, "action": DraftAction.PICK, "game_num": 2},
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.RED, "action": DraftAction.BAN},
]

BO3_SEQUENCE = [
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.RED, "action": DraftAction.BAN},
    {"team": Team.BLUE, "action": DraftAction.PICK, "game_num": 2},
    {"team": Team.RED, "action": DraftAction.PICK, "game_num": 1},
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.RED, "action": DraftAction.BAN},
]

BO1_SEQUENCE = [
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.RED, "action": DraftAction.PICK, "game_num": 1},
]


class Sequence(StrEnum):
    BO3EU = "bo3eu"
    BO3 = "bo3"
    BO1 = "bo1"


SEQUENCE_MAPPING = {
    Sequence.BO3: BO3_SEQUENCE,
    Sequence.BO1: BO1_SEQUENCE,
    Sequence.BO3EU: BO3EU_SEQUENCE,
}


MIN_MAPS = 7
