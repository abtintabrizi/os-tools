import asyncio
import random
import time

from app.constants.common import TIMER_SECONDS, Team, DraftAction, CURRENT_AWAKENING_POOL, AWAKENING_CONFLICTS
from app.constants.striker_draft import STRIKER_SEQUENCE, STRIKER_POOL
from app.constants.tables import Table
from app.utils.supabase import get_room, save_room
from app.utils.ws import manager

# Tracks the active auto-advance task per room
timers: dict[str, asyncio.Task] = {}


def generate_random_awakenings() -> list[str]:
    first = random.choice(CURRENT_AWAKENING_POOL)
    conflicts = AWAKENING_CONFLICTS.get(first, [])
    available = [a for a in CURRENT_AWAKENING_POOL if a != first and a not in conflicts]
    second = random.choice(available)
    return [str(first), str(second)]


def cancel_timer(room_id: str) -> None:
    task = timers.pop(room_id, None)
    if task and not task.done():
        task.cancel()


def spawn_timer(room_id: str, step: int, delay: float = TIMER_SECONDS) -> None:
    cancel_timer(room_id)
    timers[room_id] = asyncio.create_task(_auto_advance(room_id, step, delay))


async def _auto_advance(room_id: str, expected_step: int, delay: float) -> None:
    try:
        await asyncio.sleep(delay)
    except asyncio.CancelledError:
        return

    state = await get_room(room_id, Table.STRIKER_DRAFTS)
    if state is None or state["done"] or state["step"] != expected_step:
        return

    seq_step = STRIKER_SEQUENCE[expected_step]

    if seq_step["action"] == DraftAction.BAN:
        chosen_striker = None
    else:
        used_strikers = {a["striker"] for a in state["actions"] if a["striker"] is not None}
        available = [s for s in STRIKER_POOL if s not in used_strikers]
        if not available:
            return
        pending_key = "pendingBlue" if seq_step["team"] == Team.BLUE else "pendingRed"
        chosen_striker = state.get(pending_key)
        if not chosen_striker or chosen_striker not in available:
            chosen_striker = random.choice(available)

    team_name = state["blueName"] if seq_step["team"] == Team.BLUE else state["redName"]
    new_actions = state["actions"] + [
        {"striker": chosen_striker, "team": team_name, "action": seq_step["action"]}
    ]
    new_step = expected_step + 1
    done = new_step >= len(STRIKER_SEQUENCE)

    updated = {
        **state,
        "step": new_step,
        "actions": new_actions,
        "done": done,
        "pendingBlue": None,
        "pendingRed": None,
        "stepStartedAt": None if done else time.time(),
    }

    await save_room(room_id, updated, Table.STRIKER_DRAFTS)
    await manager.broadcast(room_id, updated)

    if not done:
        spawn_timer(room_id, new_step)
