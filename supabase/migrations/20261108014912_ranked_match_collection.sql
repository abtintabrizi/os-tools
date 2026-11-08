begin;

create table public.ranked_players (
  source_player_id text primary key check (source_player_id ~ '^[0-9a-f]{24}$')
);

create table public.ranked_matches (
  fingerprint text primary key check (fingerprint ~ '^v1:[0-9a-f]{64}$'),
  map text not null check (btrim(map) <> ''),
  duration_seconds integer not null check (duration_seconds > 0),
  bans jsonb not null check (jsonb_typeof(bans) = 'array'),
  average_tier text,
  estimated_played_at timestamptz,
  source_profile_url text not null,
  observed_at timestamptz not null,
  participants jsonb not null check (jsonb_typeof(participants) = 'array' and jsonb_array_length(participants) = 6)
);

alter table public.ranked_players enable row level security;
alter table public.ranked_matches enable row level security;

revoke all on public.ranked_players, public.ranked_matches from public, anon, authenticated, service_role;
grant select, insert, update on public.ranked_players, public.ranked_matches to service_role;

create table public.ranked_player_snapshots (
  source_player_id text not null references public.ranked_players (source_player_id),
  name text not null check (btrim(name) <> ''),
  rating integer check (rating >= 0),
  tier text,
  observed_at timestamptz not null,
  primary key (source_player_id, observed_at)
);

alter table public.ranked_player_snapshots enable row level security;

revoke all on public.ranked_player_snapshots from public, anon, authenticated, service_role;
grant select, insert on public.ranked_player_snapshots to service_role;

create function public.ingest_ranked_match(p_match jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  incoming public.ranked_matches := jsonb_populate_record(null::public.ranked_matches, p_match);
  previous public.ranked_matches;
  participant jsonb;
  previous_player jsonb;
  next_player jsonb;
  prior_key jsonb;
  merged jsonb := '[]'::jsonb;
  slot integer;
  inserted boolean;
  -- These fields describe a participant independently of their identity or optional loadout details.
  core_fields text[] := array['team', 'character', 'goals', 'assists', 'saves', 'kos'];
begin
  if jsonb_typeof(incoming.participants) is distinct from 'array' then
    raise check_violation using message = 'Ranked participants must be an array';
  end if;
  if jsonb_array_length(incoming.participants) <> 6 then
    raise check_violation using message = 'Ranked match must have six participants';
  end if;

  for slot in 0..5 loop
    participant := incoming.participants -> slot;
    if jsonb_typeof(participant) is distinct from 'object'
      or participant ->> 'team' is distinct from (case when slot < 3 then 'winner' else 'loser' end)
      or jsonb_typeof(participant -> 'character') is distinct from 'string'
      or btrim(participant ->> 'character') = ''
      or jsonb_typeof(participant -> 'mvp') is distinct from 'boolean'
      or jsonb_typeof(participant -> 'awakenings') is distinct from 'array'
      or coalesce(jsonb_typeof(participant -> 'gear'), 'null') not in ('null', 'object')
      or coalesce(jsonb_typeof(participant -> 'role'), 'null') not in ('null', 'string')
      or (participant ->> 'level' is not null and (
        jsonb_typeof(participant -> 'level') <> 'number' or participant ->> 'level' !~ '^\d+$'
      ))
      or (participant ->> 'player_id' is not null and (
        jsonb_typeof(participant -> 'player_id') <> 'string' or participant ->> 'player_id' !~ '^[0-9a-f]{24}$'
      )) then
      raise check_violation using message = 'Invalid ranked participant';
    end if;
    if exists (
      select 1 from unnest(core_fields[3:6]) as stats(stat)
      where jsonb_typeof(participant -> stat) is distinct from 'number' or participant ->> stat !~ '^\d+$'
    ) then
      raise check_violation using message = 'Invalid ranked participant stats';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(participant -> 'awakenings' || jsonb_build_array(participant -> 'gear')) as items(item)
      where item <> 'null'::jsonb and (
        jsonb_typeof(item) <> 'object'
        or coalesce(jsonb_typeof(item -> 'name'), 'null') not in ('null', 'string')
        or coalesce(jsonb_typeof(item -> 'asset'), 'null') not in ('null', 'string')
        or coalesce(nullif(item ->> 'name', ''), nullif(item ->> 'asset', '')) is null
      )
    ) then
      raise check_violation using message = 'Invalid ranked participant loadout';
    end if;
  end loop;

  if exists (
    select 1 from jsonb_array_elements(incoming.participants) as roster(player)
    where player ->> 'player_id' is not null group by player ->> 'player_id' having count(*) > 1
  ) then
    raise check_violation using message = 'Repeated player ID in ranked roster';
  end if;

  insert into public.ranked_matches select incoming.*
  on conflict (fingerprint) do nothing returning true into inserted;

  if inserted then
    merged := incoming.participants;
  else
    select * into strict previous from public.ranked_matches where fingerprint = incoming.fingerprint for update;
    if lower(previous.map) <> lower(incoming.map) or previous.duration_seconds <> incoming.duration_seconds then
      raise check_violation using message = 'Ranked fingerprint conflicts with stored match metadata';
    end if;

    for slot in 0..5 loop
      previous_player := previous.participants -> slot;
      next_player := incoming.participants -> slot;
      select jsonb_object_agg(field, previous_player -> field) into prior_key from unnest(core_fields) as fields(field);

      if not next_player @> prior_key then
        raise check_violation using message = 'Ranked fingerprint conflicts with stored roster stats';
      end if;

      if (select count(*) from jsonb_array_elements(previous.participants) as roster(player) where player @> prior_key) > 1 then
        -- Equal tuples may trade positions between views. Only a known ID can disambiguate them.
        select player into next_player from jsonb_array_elements(incoming.participants) as roster(player)
        where player @> prior_key and player ->> 'player_id' = previous_player ->> 'player_id';
      end if;

      if previous_player ->> 'player_id' is not null and next_player ->> 'player_id' is not null
        and previous_player ->> 'player_id' <> next_player ->> 'player_id' then
        raise check_violation using message = 'Ranked fingerprint conflicts with a stored participant ID';
      end if;

      merged := merged || jsonb_build_array(previous_player || jsonb_build_object(
        'player_id', coalesce(previous_player ->> 'player_id', next_player ->> 'player_id')
      ));
    end loop;

    if exists (
      select 1 from jsonb_array_elements(merged) as roster(player)
      where player ->> 'player_id' is not null group by player ->> 'player_id' having count(*) > 1
    ) then
      raise check_violation using message = 'Ranked participant enrichment would repeat a player ID';
    end if;

    update public.ranked_matches set
      estimated_played_at = coalesce(previous.estimated_played_at, incoming.estimated_played_at),
      average_tier = coalesce(previous.average_tier, incoming.average_tier),
      participants = merged
    where fingerprint = incoming.fingerprint and (
      merged is distinct from previous.participants
      or (previous.estimated_played_at is null and incoming.estimated_played_at is not null)
      or (previous.average_tier is null and incoming.average_tier is not null)
    );
  end if;

  insert into public.ranked_players (source_player_id)
  select player ->> 'player_id' from jsonb_array_elements(incoming.participants) as roster(player)
  where player ->> 'player_id' is not null order by player ->> 'player_id'
  on conflict (source_player_id) do nothing;

  return case when inserted then 'inserted' else 'existing' end;
end;
$$;

create function public.ingest_ranked_batch(p_matches jsonb, p_snapshot jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  snapshot public.ranked_player_snapshots;
  match jsonb;
  inserted_count integer := 0;
  existing_count integer := 0;
  rejected jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_matches) is distinct from 'array' then
    raise check_violation using message = 'Ranked batch must be an array';
  end if;
  if jsonb_array_length(p_matches) > 50 then
    raise check_violation using message = 'Ranked batch exceeds 50 matches';
  end if;

  -- Batch transactions can touch overlapping matches and player IDs.
  perform pg_advisory_xact_lock(hashtext('public.ingest_ranked_batch'));

  if p_snapshot is not null and p_snapshot <> 'null'::jsonb then
    snapshot := jsonb_populate_record(null::public.ranked_player_snapshots, p_snapshot);
    insert into public.ranked_players (source_player_id) values (snapshot.source_player_id)
    on conflict (source_player_id) do nothing;

    insert into public.ranked_player_snapshots select snapshot.*
    on conflict (source_player_id, observed_at) do nothing;
  end if;

  for match in select value from jsonb_array_elements(p_matches) loop
    begin
      if public.ingest_ranked_match(match) = 'inserted' then
        inserted_count := inserted_count + 1;
      else
        existing_count := existing_count + 1;
      end if;
    exception when integrity_constraint_violation or data_exception then
      rejected := rejected || jsonb_build_array(jsonb_build_object(
        'fingerprint', match ->> 'fingerprint', 'reason', sqlerrm
      ));
    end;
  end loop;

  return jsonb_build_object('inserted', inserted_count, 'existing', existing_count, 'rejected', rejected);
end;
$$;

revoke all on function public.ingest_ranked_match(jsonb), public.ingest_ranked_batch(jsonb, jsonb)
from public, anon, authenticated, service_role;
grant execute on function public.ingest_ranked_match(jsonb), public.ingest_ranked_batch(jsonb, jsonb) to service_role;

commit;
