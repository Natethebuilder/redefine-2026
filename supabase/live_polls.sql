-- Live voting for the Redefine 2026 deck (https://natethebuilder.github.io/redefine-2026/)
--
-- Run this whole file once in the Supabase dashboard: SQL Editor > New query >
-- paste > Run. It is safe to run again (for example to change the presenter key).
--
-- It only adds its own live_poll_* tables and functions. Phones and the deck
-- talk to the functions below with the public anon key; the tables themselves
-- are locked (row level security on, no policies), so nobody can read or edit
-- votes directly. Presenter-only functions need the presenter key, which is
-- stored as a bcrypt hash.
--
-- It also stores the sign-ups from the get-involved page (name, school, email
-- and so on) in live_poll_interest. The site can only add sign-ups; reading
-- them needs the presenter key (or the Supabase dashboard).

-- 1. Choose the presenter key (keep the quotes). Anyone with it can switch
--    questions, hide answers, clear votes and download sign-ups, so make it
--    long and private.
select set_config('live_poll.key', '__PRESENTER_KEY__', false);

do $$
begin
  if current_setting('live_poll.key') ~ '^__.*__$' or length(current_setting('live_poll.key')) < 8 then
    raise exception 'Choose a presenter key first: replace __PRESENTER_KEY__ near the top of this file (8 or more characters).';
  end if;
end
$$;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- 2. Tables

create table if not exists public.live_poll_polls (
  event text not null,
  id text not null,
  screen text not null,
  kind text not null check (kind in ('choice', 'scale', 'words', 'text')),
  options text[] not null default '{}',
  max_answers integer not null default 1 check (max_answers between 1 and 20),
  max_len integer not null default 1 check (max_len between 1 and 1000),
  cap integer not null default 5000 check (cap > 0),
  primary key (event, id)
);

create table if not exists public.live_poll_votes (
  id bigint generated always as identity primary key,
  event text not null,
  poll text not null,
  voter uuid not null,
  slot integer not null check (slot >= 0),
  choice text,
  response text check (char_length(response) <= 1000),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event, poll, voter, slot),
  foreign key (event, poll) references public.live_poll_polls (event, id) on delete cascade
);

create index if not exists live_poll_votes_voter_idx on public.live_poll_votes (event, voter);
create index if not exists live_poll_votes_recent_idx on public.live_poll_votes (event, poll, created_at desc);

create table if not exists public.live_poll_state (
  event text primary key,
  active text,
  updated_at timestamptz not null default now()
);

create table if not exists public.live_poll_admin (
  event text primary key,
  key_hash text not null
);

-- Get-involved sign-ups. `client` is the phone's random id, so someone can
-- correct their details without creating a second row.
create table if not exists public.live_poll_interest (
  id bigint generated always as identity primary key,
  event text not null,
  client uuid not null,
  interests text[] not null,
  name text not null check (char_length(name) between 1 and 120),
  role text check (char_length(role) <= 120),
  organisation text not null check (char_length(organisation) between 1 and 160),
  email text not null check (char_length(email) between 3 and 254),
  phone text check (char_length(phone) <= 40),
  message text check (char_length(message) <= 1000),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists live_poll_interest_client_idx on public.live_poll_interest (event, client);

alter table public.live_poll_polls enable row level security;
alter table public.live_poll_votes enable row level security;
alter table public.live_poll_state enable row level security;
alter table public.live_poll_admin enable row level security;
alter table public.live_poll_interest enable row level security;

revoke all on table
  public.live_poll_polls, public.live_poll_votes, public.live_poll_state, public.live_poll_admin, public.live_poll_interest
  from public, anon, authenticated;

-- 3. Internal helpers (not callable from the browser)

create or replace function public.live_poll__clean(p_text text)
returns text
language sql
immutable
set search_path = public, extensions, pg_temp
as $$
  select btrim(regexp_replace(coalesce(p_text, ''), '\s+', ' ', 'g'))
$$;

create or replace function public.live_poll__uuid(p_text text)
returns uuid
language sql
immutable
set search_path = public, extensions, pg_temp
as $$
  select case
    when p_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then p_text::uuid
  end
$$;

create or replace function public.live_poll__set_key(p_event text, p_key text)
returns void
language sql
set search_path = public, extensions, pg_temp
as $$
  insert into public.live_poll_admin (event, key_hash)
    values (p_event, crypt(p_key, gen_salt('bf', 8)))
    on conflict (event) do update set key_hash = excluded.key_hash
$$;

create or replace function public.live_poll__mine(p_event text, p_poll text, p_voter uuid)
returns jsonb
language sql
stable
set search_path = public, extensions, pg_temp
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('slot', slot, 'value', coalesce(choice, response)) order by slot),
    '[]'::jsonb
  )
  from public.live_poll_votes
  where event = p_event and poll = p_poll and voter = p_voter
$$;

-- 4. Audience functions

create or replace function public.live_poll_check_key(p_event text, p_key text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select coalesce(
    (select key_hash = crypt(coalesce(p_key, ''), key_hash) from public.live_poll_admin where event = p_event),
    false
  )
$$;

create or replace function public.live_poll__require_key(p_event text, p_key text)
returns void
language plpgsql
stable
set search_path = public, extensions, pg_temp
as $$
begin
  if not public.live_poll_check_key(p_event, p_key) then
    raise exception 'forbidden';
  end if;
end
$$;

create or replace function public.live_poll_submit(p_event text, p_poll text, p_voter text, p_value text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_poll public.live_poll_polls;
  v_voter uuid := public.live_poll__uuid(p_voter);
  v_value text := public.live_poll__clean(p_value);
  v_own integer;
  v_slot integer;
begin
  select * into v_poll from public.live_poll_polls where event = p_event and id = p_poll;
  if not found then
    raise exception 'unknown-poll';
  end if;
  if v_voter is null then
    raise exception 'invalid';
  end if;

  -- One change at a time per person and poll, so answer slots never collide.
  perform pg_advisory_xact_lock(hashtextextended(p_event || '/' || p_poll || '/' || v_voter::text, 0));

  if v_poll.kind in ('choice', 'scale') then
    if not (v_value = any (v_poll.options)) then
      raise exception 'invalid';
    end if;
    update public.live_poll_votes
      set choice = v_value, updated_at = now()
      where event = p_event and poll = p_poll and voter = v_voter and slot = 0;
    if not found then
      if (select count(*) from public.live_poll_votes where event = p_event and poll = p_poll) >= v_poll.cap then
        raise exception 'full';
      end if;
      insert into public.live_poll_votes (event, poll, voter, slot, choice)
        values (p_event, p_poll, v_voter, 0, v_value);
    end if;
  else
    if v_value = '' then
      raise exception 'invalid';
    end if;
    if char_length(v_value) > v_poll.max_len then
      raise exception 'too-long';
    end if;
    -- Sending the same answer twice is a no-op.
    if not exists (
      select 1 from public.live_poll_votes
      where event = p_event and poll = p_poll and voter = v_voter and lower(response) = lower(v_value)
    ) then
      select count(*), coalesce(max(slot), -1) + 1 into v_own, v_slot
        from public.live_poll_votes
        where event = p_event and poll = p_poll and voter = v_voter;
      if v_own >= v_poll.max_answers then
        raise exception 'limit';
      end if;
      if (select count(*) from public.live_poll_votes where event = p_event and poll = p_poll) >= v_poll.cap then
        raise exception 'full';
      end if;
      insert into public.live_poll_votes (event, poll, voter, slot, response)
        values (p_event, p_poll, v_voter, v_slot, v_value);
    end if;
  end if;

  return jsonb_build_object('ok', true, 'mine', public.live_poll__mine(p_event, p_poll, v_voter));
end
$$;

create or replace function public.live_poll_retract(p_event text, p_poll text, p_voter text, p_slot integer)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_voter uuid := public.live_poll__uuid(p_voter);
begin
  if not exists (select 1 from public.live_poll_polls where event = p_event and id = p_poll) then
    raise exception 'unknown-poll';
  end if;
  if v_voter is null then
    return jsonb_build_object('ok', true, 'mine', '[]'::jsonb);
  end if;
  delete from public.live_poll_votes
    where event = p_event and poll = p_poll and voter = v_voter and slot = p_slot;
  return jsonb_build_object('ok', true, 'mine', public.live_poll__mine(p_event, p_poll, v_voter));
end
$$;

-- Which question is live, plus this phone's own answers (voter may be null).
create or replace function public.live_poll_status(p_event text, p_voter text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_voter uuid := public.live_poll__uuid(p_voter);
begin
  return jsonb_build_object(
    'active', (select active from public.live_poll_state where event = p_event),
    'mine', coalesce((
      select jsonb_object_agg(
        p.id,
        case when v_voter is null then '[]'::jsonb else public.live_poll__mine(p_event, p.id, v_voter) end
      )
      from public.live_poll_polls p
      where p.event = p_event
    ), '{}'::jsonb)
  );
end
$$;

-- Aggregated results for one screen, as shown on the slides.
create or replace function public.live_poll_results(p_event text, p_screen text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_def public.live_poll_polls;
  v_polls jsonb := '{}'::jsonb;
  v_result jsonb;
  v_voters bigint;
  v_entries bigint;
begin
  for v_def in
    select * from public.live_poll_polls where event = p_event and screen = p_screen order by id
  loop
    select count(distinct voter), count(*) filter (where not hidden)
      into v_voters, v_entries
      from public.live_poll_votes
      where event = p_event and poll = v_def.id;

    if v_def.kind in ('choice', 'scale') then
      select jsonb_build_object(
        'kind', v_def.kind,
        'voters', v_voters,
        'counts', coalesce(jsonb_object_agg(o.opt, coalesce(c.n, 0)), '{}'::jsonb)
      )
      into v_result
      from unnest(v_def.options) as o(opt)
      left join (
        select choice, count(*) as n
        from public.live_poll_votes
        where event = p_event and poll = v_def.id
        group by choice
      ) c on c.choice = o.opt;
    elsif v_def.kind = 'words' then
      select jsonb_build_object(
        'kind', 'words',
        'voters', v_voters,
        'entries', v_entries,
        'words', coalesce(
          jsonb_agg(jsonb_build_object('text', g.text, 'n', g.n) order by g.n desc, lower(g.text) collate "C", g.text collate "C"),
          '[]'::jsonb
        )
      )
      into v_result
      from (
        -- Most common spelling wins; ties and order are case-insensitive A-Z.
        select mode() within group (order by response collate "C") as text, count(*) as n
        from public.live_poll_votes
        where event = p_event and poll = v_def.id and not hidden
        group by lower(response)
        order by count(*) desc, lower(mode() within group (order by response collate "C")) collate "C", 1
        limit 80
      ) g;
    else
      select jsonb_build_object(
        'kind', 'text',
        'voters', v_voters,
        'entries', v_entries,
        'responses', coalesce(
          jsonb_agg(jsonb_build_object('id', r.id, 'text', r.response, 'at', r.created_at) order by r.created_at desc, r.id desc),
          '[]'::jsonb
        )
      )
      into v_result
      from (
        select id, response, created_at
        from public.live_poll_votes
        where event = p_event and poll = v_def.id and not hidden
        order by created_at desc, id desc
        limit 50
      ) r;
    end if;

    v_polls := v_polls || jsonb_build_object(v_def.id, v_result);
  end loop;

  return jsonb_build_object(
    'screen', p_screen,
    'voters', (
      select count(distinct v.voter)
      from public.live_poll_votes v
      join public.live_poll_polls p on p.event = v.event and p.id = v.poll
      where v.event = p_event and p.screen = p_screen
    ),
    'polls', v_polls
  );
end
$$;

-- A sign-up from the get-involved page. Sending again from the same phone with
-- the same email updates that sign-up instead of adding another.
create or replace function public.live_poll_interest_submit(
  p_event text,
  p_client text,
  p_interests text[],
  p_name text,
  p_role text,
  p_organisation text,
  p_email text,
  p_phone text,
  p_message text,
  p_consent boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  c_kinds constant text[] := array['pilot', 'mentor', 'partner', 'conversation'];
  v_client uuid := public.live_poll__uuid(p_client);
  v_interests text[];
  v_name text := public.live_poll__clean(p_name);
  v_role text := nullif(public.live_poll__clean(p_role), '');
  v_org text := public.live_poll__clean(p_organisation);
  v_email text := public.live_poll__clean(p_email);
  v_phone text := nullif(public.live_poll__clean(p_phone), '');
  v_message text := nullif(public.live_poll__clean(p_message), '');
  v_id bigint;
begin
  if v_client is null or not exists (select 1 from public.live_poll_admin where event = p_event) then
    raise exception 'invalid';
  end if;
  v_interests := array(select k from unnest(c_kinds) with ordinality as t(k, n) where k = any (p_interests) order by n);
  if cardinality(v_interests) = 0
    or exists (select 1 from unnest(p_interests) as x where x is null or not (x = any (c_kinds))) then
    raise exception 'invalid';
  end if;
  if v_name = '' or v_org = '' or v_email = '' then
    raise exception 'invalid';
  end if;
  if char_length(v_name) > 120 or char_length(v_org) > 160 or char_length(v_email) > 254
    or char_length(v_role) > 120 or char_length(v_phone) > 40 or char_length(v_message) > 1000 then
    raise exception 'too-long';
  end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or p_consent is not true then
    raise exception 'invalid';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_event || '/interest/' || v_client::text, 0));

  select id into v_id
    from public.live_poll_interest
    where event = p_event and client = v_client and lower(email) = lower(v_email)
    order by id desc
    limit 1;
  if v_id is not null then
    update public.live_poll_interest
      set interests = v_interests, name = v_name, role = v_role, organisation = v_org, email = v_email,
          phone = v_phone, message = v_message, consent_at = now(), updated_at = now()
      where id = v_id;
    return jsonb_build_object('ok', true, 'updated', true);
  end if;

  -- A shared tablet at the stand may send many; this only stops runaway scripts.
  if (select count(*) from public.live_poll_interest where event = p_event and client = v_client) >= 200 then
    raise exception 'limit';
  end if;
  if (select count(*) from public.live_poll_interest where event = p_event) >= 5000 then
    raise exception 'full';
  end if;
  insert into public.live_poll_interest (event, client, interests, name, role, organisation, email, phone, message)
    values (p_event, v_client, v_interests, v_name, v_role, v_org, v_email, v_phone, v_message);
  return jsonb_build_object('ok', true, 'updated', false);
end
$$;

-- 5. Presenter functions (need the presenter key)

-- Phones can show any poll screen, or 'involved' (the get-involved invite).
create or replace function public.live_poll_set_active(p_event text, p_key text, p_screen text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  perform public.live_poll__require_key(p_event, p_key);
  if p_screen is not null and p_screen <> 'involved' and not exists (
    select 1 from public.live_poll_polls where event = p_event and screen = p_screen
  ) then
    raise exception 'invalid';
  end if;
  insert into public.live_poll_state (event, active, updated_at)
    values (p_event, p_screen, now())
    on conflict (event) do update set active = excluded.active, updated_at = excluded.updated_at;
  return jsonb_build_object('ok', true, 'active', p_screen);
end
$$;

create or replace function public.live_poll_reset(p_event text, p_key text, p_screen text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_deleted integer;
begin
  perform public.live_poll__require_key(p_event, p_key);
  delete from public.live_poll_votes v
    using public.live_poll_polls p
    where v.event = p_event and p.event = v.event and p.id = v.poll and p.screen = p_screen;
  get diagnostics v_deleted = row_count;
  return jsonb_build_object('ok', true, 'deleted', v_deleted);
end
$$;

-- "Start fresh": every answer to every question, and phones back to waiting.
-- Sign-ups are only deleted when p_signups is true.
create or replace function public.live_poll_reset_all(p_event text, p_key text, p_signups boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_votes integer;
  v_signups integer := 0;
begin
  perform public.live_poll__require_key(p_event, p_key);
  delete from public.live_poll_votes where event = p_event;
  get diagnostics v_votes = row_count;
  if p_signups is true then
    delete from public.live_poll_interest where event = p_event;
    get diagnostics v_signups = row_count;
  end if;
  update public.live_poll_state set active = null, updated_at = now() where event = p_event;
  return jsonb_build_object('ok', true, 'deleted', v_votes, 'signups_deleted', v_signups);
end
$$;

-- How many sign-ups there are (no personal details, safe to show on screen).
create or replace function public.live_poll_interest_count(p_event text, p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  perform public.live_poll__require_key(p_event, p_key);
  return (
    select jsonb_build_object('count', count(*), 'latest', max(created_at))
    from public.live_poll_interest
    where event = p_event
  );
end
$$;

create or replace function public.live_poll_interest_export(p_event text, p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  perform public.live_poll__require_key(p_event, p_key);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'interests', to_jsonb(interests), 'name', name, 'role', role, 'organisation', organisation,
      'email', email, 'phone', phone, 'message', message,
      'consent_at', consent_at, 'created_at', created_at, 'updated_at', updated_at
    ) order by created_at, id)
    from public.live_poll_interest
    where event = p_event
  ), '[]'::jsonb);
end
$$;

-- Free-text answers grouped case-insensitively, newest first, for hiding.
create or replace function public.live_poll_moderation(p_event text, p_key text, p_screen text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  perform public.live_poll__require_key(p_event, p_key);
  return jsonb_build_object('items', coalesce((
    select jsonb_agg(jsonb_build_object('poll', g.poll, 'text', g.text, 'n', g.n, 'hidden', g.hidden) order by g.last desc, g.last_id desc)
    from (
      select
        v.poll,
        (array_agg(v.response order by v.created_at, v.id))[1] as text,
        count(*) as n,
        bool_and(v.hidden) as hidden,
        max(v.created_at) as last,
        max(v.id) as last_id
      from public.live_poll_votes v
      join public.live_poll_polls p on p.event = v.event and p.id = v.poll
      where v.event = p_event and p.screen = p_screen and v.response is not null
      group by v.poll, lower(v.response)
      order by max(v.created_at) desc, max(v.id) desc
      limit 200
    ) g
  ), '[]'::jsonb));
end
$$;

create or replace function public.live_poll_hide(p_event text, p_key text, p_poll text, p_text text, p_hidden boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_updated integer;
begin
  perform public.live_poll__require_key(p_event, p_key);
  update public.live_poll_votes
    set hidden = coalesce(p_hidden, false)
    where event = p_event and poll = p_poll and response is not null
      and lower(response) = lower(public.live_poll__clean(p_text));
  get diagnostics v_updated = row_count;
  return jsonb_build_object('ok', true, 'updated', v_updated);
end
$$;

create or replace function public.live_poll_export(p_event text, p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  perform public.live_poll__require_key(p_event, p_key);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'poll', poll, 'voter', voter, 'slot', slot, 'choice', choice, 'response', response,
      'hidden', hidden, 'created_at', created_at, 'updated_at', updated_at
    ) order by created_at, id)
    from public.live_poll_votes
    where event = p_event
  ), '[]'::jsonb);
end
$$;

-- 6. Permissions: the browser may call the public functions, nothing else.

revoke all on function
  public.live_poll__clean(text),
  public.live_poll__uuid(text),
  public.live_poll__set_key(text, text),
  public.live_poll__mine(text, text, uuid),
  public.live_poll__require_key(text, text)
  from public, anon, authenticated;

revoke all on function
  public.live_poll_check_key(text, text),
  public.live_poll_submit(text, text, text, text),
  public.live_poll_retract(text, text, text, integer),
  public.live_poll_status(text, text),
  public.live_poll_results(text, text),
  public.live_poll_interest_submit(text, text, text[], text, text, text, text, text, text, boolean),
  public.live_poll_set_active(text, text, text),
  public.live_poll_reset(text, text, text),
  public.live_poll_reset_all(text, text, boolean),
  public.live_poll_moderation(text, text, text),
  public.live_poll_hide(text, text, text, text, boolean),
  public.live_poll_export(text, text),
  public.live_poll_interest_count(text, text),
  public.live_poll_interest_export(text, text)
  from public;

grant execute on function
  public.live_poll_check_key(text, text),
  public.live_poll_submit(text, text, text, text),
  public.live_poll_retract(text, text, text, integer),
  public.live_poll_status(text, text),
  public.live_poll_results(text, text),
  public.live_poll_interest_submit(text, text, text[], text, text, text, text, text, text, boolean),
  public.live_poll_set_active(text, text, text),
  public.live_poll_reset(text, text, text),
  public.live_poll_reset_all(text, text, boolean),
  public.live_poll_moderation(text, text, text),
  public.live_poll_hide(text, text, text, text, boolean),
  public.live_poll_export(text, text),
  public.live_poll_interest_count(text, text),
  public.live_poll_interest_export(text, text)
  to anon, authenticated;

-- 7. The polls in the deck (keep in sync with src/live/polls.js) and the key.

insert into public.live_poll_polls (event, id, screen, kind, options, max_answers, max_len) values
  ('redefine-2026', 'childhood', 'childhood', 'choice', '{A,B,C,D}', 1, 1),
  ('redefine-2026', 'career', 'career', 'words', '{}', 3, 40),
  ('redefine-2026', 'likelihood', 'feedback', 'scale', '{1,2,3,4,5}', 1, 1),
  ('redefine-2026', 'roadblock', 'feedback', 'text', '{}', 2, 280)
on conflict (event, id) do update set
  screen = excluded.screen,
  kind = excluded.kind,
  options = excluded.options,
  max_answers = excluded.max_answers,
  max_len = excluded.max_len;

insert into public.live_poll_state (event) values ('redefine-2026') on conflict (event) do nothing;

select public.live_poll__set_key('redefine-2026', current_setting('live_poll.key'));
select set_config('live_poll.key', '', false);

-- Tell the Supabase API about the new functions straight away.
notify pgrst, 'reload schema';
