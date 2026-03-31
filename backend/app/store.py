import random
import string

# In-memory room store: room_id -> DraftState dict
rooms: dict[str, dict] = {}


def generate_room_id() -> str:
    chars = string.ascii_uppercase + string.digits
    for _ in range(100):
        room_id = "".join(random.choices(chars, k=6))
        if room_id not in rooms:
            return room_id
    raise RuntimeError("Could not generate unique room ID")
