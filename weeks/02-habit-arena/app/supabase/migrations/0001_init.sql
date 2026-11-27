-- Habit Arena: initial schema.
-- Run once in the Supabase dashboard (SQL Editor → New query → paste → Run), or with `supabase db push`.
-- Every table has row-level security: players can only change their own rows.

-- ---------- tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nick text check (char_length(nick) <= 24),
  display_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  code text primary key check (code ~ '^[A-Z2-9]{6}$'),
  name text not null check (char_length(name) between 1 and 40),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at bigint not null,
  start_date date not null,
  end_date date not null,
  allow_personal boolean not null default true,
  proof boolean not null default false,
  habits jsonb not null default '[]'::jsonb,
  constraint rooms_dates check (end_date >= start_date),
  constraint rooms_size check (pg_column_size(habits) < 16384)
);

-- one row per player per room: membership plus that player's check-ins, personal habits and cheers
create table if not exists public.room_members (
  room_code text not null references public.rooms (code) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  joined_at bigint not null,
  personal jsonb not null default '[]'::jsonb,
  log jsonb not null default '{}'::jsonb,
  cheers jsonb not null default '{}'::jsonb,
  primary key (room_code, user_id),
  constraint room_members_size check (pg_column_size(log) + pg_column_size(cheers) < 262144)
);
create index if not exists room_members_user on public.room_members (user_id);

-- the personal island (private)
create table if not exists public.islands (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  doc jsonb not null,
  updated_at timestamptz not null default now(),
  constraint islands_size check (pg_column_size(doc) < 524288)
);

-- an opt-in copy of the island without habit names, visible to people you share a room with
create table if not exists public.island_public (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  doc jsonb not null,
  updated_at timestamptz not null default now(),
  constraint island_public_size check (pg_column_size(doc) < 524288)
);

-- ---------- helpers (security definer avoids RLS recursion on room_members) ----------
create or replace function public.is_room_member(code text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.room_members where room_code = code and user_id = auth.uid());
$$;

create or replace function public.shares_room_with(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.room_members a join public.room_members b on a.room_code = b.room_code
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists islands_touch on public.islands;
create trigger islands_touch before update on public.islands for each row execute function public.touch_updated_at();
drop trigger if exists island_public_touch on public.island_public;
create trigger island_public_touch before update on public.island_public for each row execute function public.touch_updated_at();
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- ---------- row-level security ----------
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.islands enable row level security;
alter table public.island_public enable row level security;

-- profiles: everyone signed in can see names; you edit only your own
create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- rooms: readable by code; only the creator edits or deletes
create policy "rooms readable" on public.rooms for select to authenticated using (true);
create policy "rooms insert own" on public.rooms for insert to authenticated with check (created_by = auth.uid());
create policy "rooms update by creator" on public.rooms for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "rooms delete by creator" on public.rooms for delete to authenticated using (created_by = auth.uid());

-- room_members: visible to players in the same room; you write only your own row; the creator can remove players
create policy "members readable by room" on public.room_members for select to authenticated using (user_id = auth.uid() or public.is_room_member(room_code));
create policy "members insert own" on public.room_members for insert to authenticated with check (user_id = auth.uid());
create policy "members update own" on public.room_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "members delete own or by creator" on public.room_members for delete to authenticated using (
  user_id = auth.uid() or exists (select 1 from public.rooms r where r.code = room_code and r.created_by = auth.uid())
);

-- islands: private to the owner
create policy "islands own" on public.islands for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- shared islands: you, and people you share a room with
create policy "island_public readable" on public.island_public for select to authenticated using (user_id = auth.uid() or public.shares_room_with(user_id));
create policy "island_public insert own" on public.island_public for insert to authenticated with check (user_id = auth.uid());
create policy "island_public update own" on public.island_public for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "island_public delete own" on public.island_public for delete to authenticated using (user_id = auth.uid());

-- ---------- realtime ----------
alter table public.room_members replica identity full;
alter table public.rooms replica identity full;
alter publication supabase_realtime add table public.rooms, public.room_members, public.islands, public.island_public, public.profiles;

-- ---------- storage: proof photos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy "proofs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "proofs delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
