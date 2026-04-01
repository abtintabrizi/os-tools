import asyncio
import os
import random
import string

from supabase import Client, create_client

_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        )
    return _client


def generate_room_id() -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=6))


async def get_room(room_id: str) -> dict | None:
    def _fetch() -> dict | None:
        result = _get_client().table("drafts").select("state").eq("room_id", room_id).maybe_single().execute()
        return result.data["state"] if result.data else None

    return await asyncio.to_thread(_fetch)


async def save_room(room_id: str, state: dict) -> None:
    def _save() -> None:
        _get_client().table("drafts").upsert(
            {"room_id": room_id, "state": state},
            on_conflict="room_id",
        ).execute()

    await asyncio.to_thread(_save)
