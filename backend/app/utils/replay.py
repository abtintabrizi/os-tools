import time

from app.constants.common import Team


def elapsed_ms(state: dict, now: float | None = None) -> int:
    started_at = state.get("replayStartedAt")
    if started_at is None:
        return 0
    return max(0, round(((now if now is not None else time.time()) - started_at) * 1000))


def append_replay_event(state: dict, event: dict, now: float | None = None) -> list[dict]:
    if state.get("replayStartedAt") is None:
        return state.get("replayEvents", [])
    return [
        *state.get("replayEvents", []),
        {**event, "atMs": elapsed_ms(state, now)},
    ]


def state_for_client(state: dict, side: str = Team.SPECTATOR) -> dict:
    payload = {**state}
    if not state.get("done"):
        payload.pop("replayEvents", None)
        payload["pendingBlue"] = state.get("pendingBlue") if side == Team.BLUE else None
        payload["pendingRed"] = state.get("pendingRed") if side == Team.RED else None
    return payload
