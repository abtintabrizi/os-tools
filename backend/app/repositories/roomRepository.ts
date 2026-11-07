import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { TABLES } from "../constants/tables.js";
import type { DraftType } from "../models/common.js";
import type { RoomState, RoomStore } from "../models/room.js";

export class SupabaseRoomRepository implements RoomStore {
  public constructor(private readonly client: SupabaseClient) {}

  public get = async (type: DraftType, roomId: string): Promise<RoomState | null> => {
    const { data, error } = await this.client.from(TABLES[type]).select("state").eq("room_id", roomId).maybeSingle();

    if (error) throw new Error(`Failed to load ${type} room: ${error.message}`);

    return (data?.state as RoomState | null) ?? null;
  };

  public save = async (type: DraftType, state: RoomState): Promise<void> => {
    const { error } = await this.client
      .from(TABLES[type])
      .upsert({ room_id: state.roomId, state }, { onConflict: "room_id" });

    if (error) throw new Error(`Failed to save ${type} room: ${error.message}`);
  };
}

export function createRoomRepository(): SupabaseRoomRepository {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  return new SupabaseRoomRepository(client);
}
