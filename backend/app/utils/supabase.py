import asyncio
import os
import random
import string
import threading

from supabase import Client, create_client

# Thread-local storage so each thread pool worker gets its own client+connection.
# The Supabase sync client uses httpx with HTTP/2, which is not thread-safe when
# shared across threads.
_local = threading.local()


def _get_client() -> Client:
    if not hasattr(_local, "client"):
        _local.client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        )
    return _local.client


def generate_room_id() -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=6))


async def get_room(room_id: str, table: str) -> dict | None:
    def _fetch() -> dict | None:
        result = (
            _get_client()
            .table(table)
            .select("state")
            .eq("room_id", room_id)
            .maybe_single()
            .execute()
        )
        return result.data["state"] if result.data else None

    return await asyncio.to_thread(_fetch)


async def save_room(room_id: str, state: dict, table: str) -> None:
    def _save() -> None:
        _get_client().table(table).upsert(
            {"room_id": room_id, "state": state},
            on_conflict="room_id",
        ).execute()

    await asyncio.to_thread(_save)
