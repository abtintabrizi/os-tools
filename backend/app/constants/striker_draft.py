from app.constants.common import Team, DraftAction

STRIKER_SEQUENCE = [
    {"team": Team.BLUE, "action": DraftAction.BAN},
    {"team": Team.RED, "action": DraftAction.BAN},
    {"team": Team.BLUE, "action": DraftAction.PICK},
    {"team": Team.RED, "action": DraftAction.PICK},
    {"team": Team.RED, "action": DraftAction.PICK},
    {"team": Team.BLUE, "action": DraftAction.PICK},
    {"team": Team.BLUE, "action": DraftAction.PICK},
    {"team": Team.RED, "action": DraftAction.PICK},
]

STRIKER_POOL = [
    "Ai.Mi",
    "Asher",
    "Atlas",
    "Drek'ar",
    "Dubu",
    "Era",
    "Estelle",
    "Finii",
    "Juliette",
    "Juno",
    "Kai",
    "Kazan",
    "Luna",
    "Mako",
    "Nao",
    "Octavia",
    "Rasmus",
    "Rune",
    "Vyce",
    "X",
    "Zentaro",
]
