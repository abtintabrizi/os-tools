import asyncio
import random
import time

from app.constants.common import TIMER_SECONDS, Team, DraftAction
from app.constants.map_draft import SEQUENCE_MAPPING, Sequence
from app.constants.tables import Table
from app.utils.supabase import get_room, save_room
from app.utils.ws import manager

# Tracks the active auto-advance task per room
timers: dict[str, asyncio.Task] = {}


def append_decider(maps: list[str], actions: list[dict], best_of: str) -> list[dict]:
    if best_of != Sequence.BO3:
        return actions
    used = {a["map"] for a in actions}
    remaining = [m for m in maps if m not in used]
    if len(remaining) == 1:
        return actions + [{"map": remaining[0], "team": None, "action": DraftAction.PICK}]
    return actions


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

    state = await get_room(room_id, Table.MAP_DRAFTS)
    if state is None or state["done"] or state["step"] != expected_step:
        return

    sequence = SEQUENCE_MAPPING[state["bestOf"]]
    seq_step = sequence[expected_step]

    pending_key = "pendingBlue" if seq_step["team"] == Team.BLUE else "pendingRed"
    chosen_map = state.get(pending_key)

    used_maps = {a["map"] for a in state["actions"]}
    available = [m for m in state["maps"] if m not in used_maps]
    if not available:
        return

    if not chosen_map or chosen_map not in available:
        chosen_map = random.choice(available)

    team_name = state["blueName"] if seq_step["team"] == Team.BLUE else state["redName"]
    new_actions = state["actions"] + [{"map": chosen_map, "team": team_name, "action": seq_step["action"]}]
    new_step = expected_step + 1
    done = new_step >= len(sequence)
    if done:
        new_actions = append_decider(state["maps"], new_actions, state["bestOf"])

    updated = {
        **state,
        "step": new_step,
        "actions": new_actions,
        "done": done,
        "pendingBlue": None,
        "pendingRed": None,
        "stepStartedAt": None if done else time.time(),
    }

    await save_room(room_id, updated, Table.MAP_DRAFTS)
    await manager.broadcast(room_id, updated)

    if not done:
        spawn_timer(room_id, new_step)
