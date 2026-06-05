import asyncio
import logging
import random
import time

from app.constants.common import (
    TIMER_SECONDS,
    Team,
    DraftAction,
    CURRENT_AWAKENING_POOL,
    AWAKENING_CONFLICTS,
)
from app.constants.striker_draft import STRIKER_SEQUENCE, STRIKER_POOL
from app.constants.tables import Table
from app.utils.supabase import get_room, save_room
from app.utils.ws import manager

logger = logging.getLogger(__name__)

# Tracks the active auto-advance task per room
timers: dict[str, asyncio.Task] = {}

# Per-room locks to prevent concurrent read-modify-write races
_room_locks: dict[str, asyncio.Lock] = {}


def get_room_lock(room_id: str) -> asyncio.Lock:
    if room_id not in _room_locks:
        _room_locks[room_id] = asyncio.Lock()
    return _room_locks[room_id]


def generate_random_awakenings(bannedStarts: list[str]) -> list[str]:
    first_pool = [a for a in CURRENT_AWAKENING_POOL if a not in bannedStarts]
    if not first_pool:
        raise ValueError("No awakenings available: all are banned.")
    first = random.choice(first_pool)
    conflicts = AWAKENING_CONFLICTS.get(first, [])
    available = [
        a
        for a in CURRENT_AWAKENING_POOL
        if a != first and a not in conflicts and a not in bannedStarts
    ]
    if not available:
        raise ValueError(
            f"No compatible second awakening available after choosing '{first}'."
        )
    second = random.choice(available)
    return [str(first), str(second)]


def cancel_timer(room_id: str) -> None:
    task = timers.pop(room_id, None)
    if task and not task.done():
        task.cancel()
        logger.info("[room=%s] Timer cancelled", room_id)


def spawn_timer(room_id: str, step: int, delay: float = TIMER_SECONDS) -> None:
    cancel_timer(room_id)
    timers[room_id] = asyncio.create_task(_auto_advance(room_id, step, delay))
    logger.info(
        "[room=%s] Timer spawned for step=%d, delay=%.1fs", room_id, step, delay
    )


async def _auto_advance(room_id: str, expected_step: int, delay: float) -> None:
    try:
        await asyncio.sleep(delay)
    except asyncio.CancelledError:
        return

    fire_time = time.time()
    async with get_room_lock(room_id):
        state = await get_room(room_id, Table.STRIKER_DRAFTS)
        if state is None or state["done"] or state["step"] != expected_step:
            actual_step = state["step"] if state else "N/A"
            logger.info(
                "[room=%s] [step=%d] Auto-advance skipped: current step=%s done=%s",
                room_id,
                expected_step,
                actual_step,
                state["done"] if state else "N/A",
            )
            return

        step_started_at = state.get("stepStartedAt")
        elapsed = round(fire_time - step_started_at, 3) if step_started_at else None
        seq_step = STRIKER_SEQUENCE[expected_step]

        banned_strikers = {
            a["striker"]
            for a in state["actions"]
            if a["action"] == DraftAction.BAN and a["striker"] is not None
        }
        used_strikers = {
            a["striker"] for a in state["actions"] if a["striker"] is not None
        }
        pending_key = "pendingBlue" if seq_step["team"] == Team.BLUE else "pendingRed"
        pending = state.get(pending_key)

        if seq_step["action"] == DraftAction.BAN:
            available_to_ban = [s for s in STRIKER_POOL if s not in banned_strikers]
            chosen_striker = (
                pending if pending and pending in available_to_ban else None
            )
        else:
            available = [s for s in STRIKER_POOL if s not in used_strikers]
            if not available:
                return
            chosen_striker = (
                pending
                if pending and pending in available
                else random.choice(available)
            )

        logger.info(
            "[room=%s] [side=%s] [step=%d] Auto-advance: %s -> %s (elapsed=%.3fs, pending=%s, stepStartedAt=%.3f)",
            room_id,
            seq_step["team"],
            expected_step,
            seq_step["action"],
            chosen_striker,
            elapsed if elapsed is not None else -1,
            pending,
            step_started_at if step_started_at is not None else -1,
        )
        new_actions = state["actions"] + [
            {
                "striker": chosen_striker,
                "team": seq_step["team"],
                "step": expected_step,
                "action": seq_step["action"],
            }
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
