# Supabase Schema (MVP Email + Password) - SQL + RLS

Use este script no SQL Editor do Supabase (novo projeto), em um unico run.

```sql
-- =========================================================
-- 0) Extensions
-- =========================================================
create extension if not exists pgcrypto;
create extension if not exists citext;

-- =========================================================
-- 1) Helper functions
-- =========================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.block_user_economy_changes()
returns trigger
language plpgsql
as $$
begin
  -- service_role, admin, or internal RPC flow can update economy fields
  if auth.role() = 'service_role'
     or public.is_admin()
     or current_setting('app.bypass_economy_guard', true) = '1' then
    return new;
  end if;

  if new.coins <> old.coins
     or new.gold_coins <> old.gold_coins
     or new.xp <> old.xp
     or new.level <> old.level
     or new.streak <> old.streak then
    raise exception 'Direct update of economy fields is not allowed';
  end if;

  return new;
end;
$$;

-- Create a base row on auth signup
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    display_name,
    photo_url,
    last_active_date
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    current_date
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- =========================================================
-- 2) Enums
-- =========================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_category') then
    create type public.event_category as enum (
      'esportes', 'politica', 'entretenimento', 'tecnologia', 'economia', 'outros'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum ('open', 'closed', 'resolved', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'bet_choice') then
    create type public.bet_choice as enum ('sim', 'nao');
  end if;

  if not exists (select 1 from pg_type where typname = 'bet_status') then
    create type public.bet_status as enum ('pending', 'won', 'lost', 'refunded');
  end if;

  if not exists (select 1 from pg_type where typname = 'shop_item_type') then
    create type public.shop_item_type as enum ('xp_boost', 'coin_pack', 'avatar_frame', 'streak_shield');
  end if;

  if not exists (select 1 from pg_type where typname = 'shop_category') then
    create type public.shop_category as enum ('vouchers', 'in-app', 'fisicos');
  end if;

  if not exists (select 1 from pg_type where typname = 'redemption_status') then
    create type public.redemption_status as enum ('pending', 'fulfilled', 'cancelled');
  end if;
end $$;

-- =========================================================
-- 3) Core tables
-- =========================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique,
  display_name text not null default '',
  photo_url text not null default '',
  coins bigint not null default 1000 check (coins >= 0),
  gold_coins bigint not null default 0 check (gold_coins >= 0),
  xp bigint not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  streak integer not null default 0 check (streak >= 0),
  ad_view_date date,
  ad_view_count integer not null default 0 check (ad_view_count >= 0),
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_username_format check (
    username is null or username ~* '^[a-z0-9_]{3,20}$'
  )
);

create table if not exists public.usernames (
  username citext primary key,
  user_id uuid not null unique references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint usernames_format check (username ~* '^[a-z0-9_]{3,20}$')
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  theme_color text,
  banner_text text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seasons_date_check check (starts_at < ends_at)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category public.event_category not null default 'outros',
  image_url text,
  status public.event_status not null default 'open',
  sim_count integer not null default 0 check (sim_count >= 0),
  nao_count integer not null default 0 check (nao_count >= 0),
  total_bets integer not null default 0 check (total_bets >= 0),
  total_coins bigint not null default 0 check (total_coins >= 0),
  sponsored boolean not null default false,
  sponsor_name text,
  sponsor_logo_url text,
  sponsor_impressions integer not null default 0 check (sponsor_impressions >= 0),
  sponsor_participations integer not null default 0 check (sponsor_participations >= 0),
  featured boolean not null default false,
  season_id uuid references public.seasons(id) on delete set null,
  result public.bet_choice,
  created_by uuid not null references public.users(id) on delete restrict,
  closes_at timestamptz not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  choice public.bet_choice not null,
  amount bigint not null check (amount >= 10),
  status public.bet_status not null default 'pending',
  payout bigint check (payout is null or payout >= 0),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (user_id, event_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  amount bigint not null,
  currency text not null default 'coin' check (currency in ('coin', 'gold')),
  description text not null,
  related_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rankings (
  id uuid primary key default gen_random_uuid(),
  period text not null,
  category text not null,
  season_id uuid references public.seasons(id) on delete set null,
  entries jsonb not null default '[]'::jsonb,
  calculated_at timestamptz not null default now(),
  unique (period, category)
);

create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  type public.shop_item_type not null,
  category public.shop_category not null,
  emoji text not null default '[gift]',
  price bigint not null default 0 check (price >= 0),
  stock integer check (stock is null or stock >= 0),
  sponsored_event_id uuid references public.events(id) on delete set null,
  gold_only boolean not null default false,
  gold_price bigint check (gold_price is null or gold_price >= 0),
  image_url text,
  effect jsonb not null default '{}'::jsonb,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_items_price_rule check (
    (gold_only = false and price > 0)
    or
    (gold_only = true and coalesce(gold_price, 0) > 0)
  )
);

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  item_id uuid not null references public.shop_items(id) on delete restrict,
  item_name text not null,
  item_emoji text not null default '[gift]',
  price bigint not null check (price >= 0),
  currency text not null default 'coin' check (currency in ('coin', 'gold')),
  status public.redemption_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null default 'trophy',
  xp_reward integer not null default 0 check (xp_reward >= 0),
  coin_reward integer not null default 0 check (coin_reward >= 0),
  condition text not null
);

create table if not exists public.user_achievements (
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_invite_code_format check (invite_code ~ '^[A-Z2-9]{4,8}$')
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.season_stats (
  season_id uuid primary key references public.seasons(id) on delete cascade,
  total_bets bigint not null default 0 check (total_bets >= 0),
  total_coins bigint not null default 0 check (total_coins >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.economy_snapshots (
  date date primary key,
  users_count integer not null default 0,
  total_coins bigint not null default 0,
  total_gold_coins bigint not null default 0,
  total_open_bets_coins bigint not null default 0,
  generated_at timestamptz not null default now()
);

create table if not exists public.economy_alerts (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('info', 'warning', 'critical')),
  title text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  level text not null check (level in ('info', 'warning', 'critical')),
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 4) Indexes
-- =========================================================
create index if not exists idx_users_xp_desc on public.users (xp desc);
create index if not exists idx_users_coins_desc on public.users (coins desc);
create index if not exists idx_events_status_created_at on public.events (status, created_at desc);
create index if not exists idx_events_closes_at on public.events (closes_at);
create index if not exists idx_bets_event_status on public.bets (event_id, status);
create index if not exists idx_bets_user_created_at on public.bets (user_id, created_at desc);
create index if not exists idx_transactions_user_created_at on public.transactions (user_id, created_at desc);
create index if not exists idx_shop_items_available_price on public.shop_items (available, price);
create index if not exists idx_redemptions_user_created_at on public.redemptions (user_id, created_at desc);
create index if not exists idx_groups_owner on public.groups (owner_id);
create index if not exists idx_groups_invite_code on public.groups (invite_code);
create index if not exists idx_group_members_user on public.group_members (user_id);
create index if not exists idx_seasons_active on public.seasons (active, starts_at desc);
create index if not exists idx_rankings_period_category on public.rankings (period, category);

-- =========================================================
-- 5) Triggers
-- =========================================================
drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_shop_items_updated_at on public.shop_items;
create trigger trg_shop_items_updated_at
before update on public.shop_items
for each row
execute function public.set_updated_at();

drop trigger if exists trg_redemptions_updated_at on public.redemptions;
create trigger trg_redemptions_updated_at
before update on public.redemptions
for each row
execute function public.set_updated_at();

drop trigger if exists trg_groups_updated_at on public.groups;
create trigger trg_groups_updated_at
before update on public.groups
for each row
execute function public.set_updated_at();

drop trigger if exists trg_seasons_updated_at on public.seasons;
create trigger trg_seasons_updated_at
before update on public.seasons
for each row
execute function public.set_updated_at();

drop trigger if exists trg_season_stats_updated_at on public.season_stats;
create trigger trg_season_stats_updated_at
before update on public.season_stats
for each row
execute function public.set_updated_at();

drop trigger if exists trg_block_user_economy_changes on public.users;
create trigger trg_block_user_economy_changes
before update on public.users
for each row
execute function public.block_user_economy_changes();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

-- =========================================================
-- 6) Row Level Security
-- =========================================================
alter table public.users enable row level security;
alter table public.usernames enable row level security;
alter table public.seasons enable row level security;
alter table public.events enable row level security;
alter table public.bets enable row level security;
alter table public.transactions enable row level security;
alter table public.rankings enable row level security;
alter table public.shop_items enable row level security;
alter table public.redemptions enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.season_stats enable row level security;
alter table public.economy_snapshots enable row level security;
alter table public.economy_alerts enable row level security;
alter table public.security_alerts enable row level security;

-- users
drop policy if exists users_select_authenticated on public.users;
create policy users_select_authenticated
on public.users
for select
to authenticated
using (true);

drop policy if exists users_insert_own on public.users;
create policy users_insert_own
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists users_delete_admin on public.users;
create policy users_delete_admin
on public.users
for delete
to authenticated
using (public.is_admin());

-- usernames
drop policy if exists usernames_select_authenticated on public.usernames;
create policy usernames_select_authenticated
on public.usernames
for select
to authenticated
using (true);

drop policy if exists usernames_insert_own on public.usernames;
create policy usernames_insert_own
on public.usernames
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists usernames_update_owner_or_admin on public.usernames;
create policy usernames_update_owner_or_admin
on public.usernames
for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists usernames_delete_owner_or_admin on public.usernames;
create policy usernames_delete_owner_or_admin
on public.usernames
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

-- seasons
drop policy if exists seasons_select_authenticated on public.seasons;
create policy seasons_select_authenticated
on public.seasons
for select
to authenticated
using (true);

drop policy if exists seasons_write_admin on public.seasons;
create policy seasons_write_admin
on public.seasons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- events
drop policy if exists events_select_authenticated on public.events;
create policy events_select_authenticated
on public.events
for select
to authenticated
using (true);

drop policy if exists events_write_admin on public.events;
create policy events_write_admin
on public.events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- bets
drop policy if exists bets_select_owner_or_admin on public.bets;
create policy bets_select_owner_or_admin
on public.bets
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists bets_insert_owner_pending_open_event on public.bets;
create policy bets_insert_owner_pending_open_event
on public.bets
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and amount >= 10
  and exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.status = 'open'
      and e.closes_at > now()
  )
);

drop policy if exists bets_update_admin on public.bets;
create policy bets_update_admin
on public.bets
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists bets_delete_admin on public.bets;
create policy bets_delete_admin
on public.bets
for delete
to authenticated
using (public.is_admin());

-- transactions
drop policy if exists transactions_select_owner_or_admin on public.transactions;
create policy transactions_select_owner_or_admin
on public.transactions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists transactions_write_admin on public.transactions;
create policy transactions_write_admin
on public.transactions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- rankings
drop policy if exists rankings_select_authenticated on public.rankings;
create policy rankings_select_authenticated
on public.rankings
for select
to authenticated
using (true);

drop policy if exists rankings_write_admin on public.rankings;
create policy rankings_write_admin
on public.rankings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- shop_items
drop policy if exists shop_items_select_available_or_admin on public.shop_items;
create policy shop_items_select_available_or_admin
on public.shop_items
for select
to authenticated
using (available = true or public.is_admin());

drop policy if exists shop_items_write_admin on public.shop_items;
create policy shop_items_write_admin
on public.shop_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- redemptions
drop policy if exists redemptions_select_owner_or_admin on public.redemptions;
create policy redemptions_select_owner_or_admin
on public.redemptions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists redemptions_insert_owner_pending on public.redemptions;
create policy redemptions_insert_owner_pending
on public.redemptions
for insert
to authenticated
with check (user_id = auth.uid() and status = 'pending');

drop policy if exists redemptions_update_admin on public.redemptions;
create policy redemptions_update_admin
on public.redemptions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists redemptions_delete_admin on public.redemptions;
create policy redemptions_delete_admin
on public.redemptions
for delete
to authenticated
using (public.is_admin());

-- achievements
drop policy if exists achievements_select_authenticated on public.achievements;
create policy achievements_select_authenticated
on public.achievements
for select
to authenticated
using (true);

drop policy if exists achievements_write_admin on public.achievements;
create policy achievements_write_admin
on public.achievements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- user_achievements
drop policy if exists user_achievements_select_owner_or_admin on public.user_achievements;
create policy user_achievements_select_owner_or_admin
on public.user_achievements
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_achievements_write_admin on public.user_achievements;
create policy user_achievements_write_admin
on public.user_achievements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- groups
drop policy if exists groups_select_member_or_owner_or_admin on public.groups;
create policy groups_select_member_or_owner_or_admin
on public.groups
for select
to authenticated
using (
  public.is_admin()
  or owner_id = auth.uid()
  or exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists groups_insert_owner on public.groups;
create policy groups_insert_owner
on public.groups
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists groups_update_owner_or_admin on public.groups;
create policy groups_update_owner_or_admin
on public.groups
for update
to authenticated
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists groups_delete_admin on public.groups;
create policy groups_delete_admin
on public.groups
for delete
to authenticated
using (public.is_admin());

-- group_members
drop policy if exists group_members_select_group_member_or_admin on public.group_members;
create policy group_members_select_group_member_or_admin
on public.group_members
for select
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
  or exists (
    select 1 from public.group_members gm2
    where gm2.group_id = group_members.group_id
      and gm2.user_id = auth.uid()
  )
);

drop policy if exists group_members_insert_self_owner_or_admin on public.group_members;
create policy group_members_insert_self_owner_or_admin
on public.group_members
for insert
to authenticated
with check (
  public.is_admin()
  or user_id = auth.uid()
  or exists (
    select 1 from public.groups g
    where g.id = group_id
      and g.owner_id = auth.uid()
  )
);

drop policy if exists group_members_delete_self_owner_or_admin on public.group_members;
create policy group_members_delete_self_owner_or_admin
on public.group_members
for delete
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
  or exists (
    select 1 from public.groups g
    where g.id = group_id
      and g.owner_id = auth.uid()
  )
);

-- season_stats
drop policy if exists season_stats_select_authenticated on public.season_stats;
create policy season_stats_select_authenticated
on public.season_stats
for select
to authenticated
using (true);

drop policy if exists season_stats_write_admin on public.season_stats;
create policy season_stats_write_admin
on public.season_stats
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- economy/admin tables
drop policy if exists economy_snapshots_admin_only on public.economy_snapshots;
create policy economy_snapshots_admin_only
on public.economy_snapshots
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists economy_alerts_admin_only on public.economy_alerts;
create policy economy_alerts_admin_only
on public.economy_alerts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists security_alerts_admin_only on public.security_alerts;
create policy security_alerts_admin_only
on public.security_alerts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- 7) RPCs (frontend calls)
-- =========================================================
create or replace function public.place_bet(
  p_event_id uuid,
  p_choice public.bet_choice,
  p_amount bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events%rowtype;
  v_user public.users%rowtype;
  v_bet_id uuid := gen_random_uuid();
  v_tx_id uuid := gen_random_uuid();
begin
  if v_uid is null then
    raise exception 'Login required.';
  end if;

  if p_amount < 10 then
    raise exception 'Minimum bet is 10.';
  end if;

  select *
  into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found.';
  end if;

  if v_event.status <> 'open' or v_event.closes_at <= now() then
    raise exception 'Event is closed.';
  end if;

  if exists (
    select 1
    from public.bets
    where user_id = v_uid
      and event_id = p_event_id
  ) then
    raise exception 'You already placed a bet on this event.';
  end if;

  select *
  into v_user
  from public.users
  where id = v_uid
  for update;

  if not found then
    raise exception 'User profile not found.';
  end if;

  if coalesce(v_user.coins, 0) < p_amount then
    raise exception 'Insufficient balance.';
  end if;

  perform set_config('app.bypass_economy_guard', '1', true);

  update public.users
  set coins = coins - p_amount
  where id = v_uid;

  insert into public.bets (
    id, user_id, event_id, choice, amount, status
  ) values (
    v_bet_id, v_uid, p_event_id, p_choice, p_amount, 'pending'
  );

  update public.events
  set
    sim_count = sim_count + case when p_choice = 'sim' then p_amount else 0 end,
    nao_count = nao_count + case when p_choice = 'nao' then p_amount else 0 end,
    total_bets = total_bets + 1,
    total_coins = total_coins + p_amount,
    sponsor_participations = sponsor_participations + case when sponsored then 1 else 0 end
  where id = p_event_id;

  if v_event.season_id is not null then
    insert into public.season_stats (season_id, total_bets, total_coins, updated_at)
    values (v_event.season_id, 1, p_amount, now())
    on conflict (season_id) do update
    set
      total_bets = public.season_stats.total_bets + 1,
      total_coins = public.season_stats.total_coins + p_amount,
      updated_at = now();
  end if;

  insert into public.transactions (
    id, user_id, type, amount, currency, description, related_id
  ) values (
    v_tx_id,
    v_uid,
    'bet_placed',
    -p_amount,
    'coin',
    format('Aposta em "%s" - %s', v_event.title, upper(p_choice::text)),
    p_event_id
  );

  return jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'transaction_id', v_tx_id
  );
end;
$$;

create or replace function public.record_sponsored_impression(
  p_event_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Login required.';
  end if;

  update public.events
  set sponsor_impressions = sponsor_impressions + 1
  where id = p_event_id
    and sponsored = true;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.resolve_event(
  p_event_id uuid,
  p_result public.bet_choice
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_bet record;
  v_total_pot bigint := 0;
  v_winners_total bigint := 0;
  v_winners_count integer := 0;
  v_losers_count integer := 0;
  v_rake_amount bigint := 0;
  v_net_pot bigint := 0;
  v_payout bigint := 0;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  select *
  into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found.';
  end if;

  if v_event.status <> 'open' then
    raise exception 'Event is not open.';
  end if;

  for v_bet in
    select *
    from public.bets
    where event_id = p_event_id
      and status = 'pending'
    for update
  loop
    v_total_pot := v_total_pot + coalesce(v_bet.amount, 0);
    if v_bet.choice = p_result then
      v_winners_total := v_winners_total + coalesce(v_bet.amount, 0);
      v_winners_count := v_winners_count + 1;
    else
      v_losers_count := v_losers_count + 1;
    end if;
  end loop;

  if v_total_pot = 0 then
    update public.events
    set status = 'resolved', result = p_result, resolved_at = now()
    where id = p_event_id;

    return jsonb_build_object(
      'resolved', true,
      'winnersCount', 0,
      'losersCount', 0,
      'totalPot', 0,
      'rakeAmount', 0,
      'netPot', 0
    );
  end if;

  v_rake_amount := floor(v_total_pot * 0.05);
  v_net_pot := v_total_pot - v_rake_amount;

  perform set_config('app.bypass_economy_guard', '1', true);

  for v_bet in
    select *
    from public.bets
    where event_id = p_event_id
      and status = 'pending'
    for update
  loop
    if v_bet.choice = p_result then
      if v_winners_total > 0 then
        v_payout := floor(v_net_pot::numeric * (v_bet.amount::numeric / v_winners_total::numeric));
      else
        v_payout := 0;
      end if;

      update public.bets
      set status = 'won', payout = v_payout, resolved_at = now()
      where id = v_bet.id;

      update public.users
      set
        coins = coins + v_payout,
        xp = xp + 25
      where id = v_bet.user_id;

      insert into public.transactions (
        user_id, type, amount, currency, description, related_id
      ) values (
        v_bet.user_id,
        'bet_won',
        v_payout,
        'coin',
        format('Acertou e ganhou %s Q$ no evento "%s"', v_payout, v_event.title),
        p_event_id
      );
    else
      update public.bets
      set status = 'lost', payout = 0, resolved_at = now()
      where id = v_bet.id;

      update public.users
      set xp = xp + 10
      where id = v_bet.user_id;
    end if;
  end loop;

  update public.events
  set status = 'resolved', result = p_result, resolved_at = now()
  where id = p_event_id;

  return jsonb_build_object(
    'resolved', true,
    'winnersCount', v_winners_count,
    'losersCount', v_losers_count,
    'totalPot', v_total_pot,
    'rakeAmount', v_rake_amount,
    'netPot', v_net_pot
  );
end;
$$;

create or replace function public.redeem_shop_item(
  p_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.shop_items%rowtype;
  v_user public.users%rowtype;
  v_redemption_id uuid := gen_random_uuid();
begin
  if v_uid is null then
    raise exception 'Login required.';
  end if;

  select * into v_item
  from public.shop_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Item not found.';
  end if;

  if not v_item.available then
    raise exception 'Item unavailable.';
  end if;

  if v_item.stock is not null and v_item.stock <= 0 then
    raise exception 'Out of stock.';
  end if;

  select * into v_user
  from public.users
  where id = v_uid
  for update;

  if not found then
    raise exception 'User profile not found.';
  end if;

  perform set_config('app.bypass_economy_guard', '1', true);

  if coalesce(v_item.gold_only, false) then
    if coalesce(v_item.gold_price, 0) <= 0 then
      raise exception 'Invalid gold price.';
    end if;
    if coalesce(v_user.gold_coins, 0) < v_item.gold_price then
      raise exception 'Insufficient Gold.';
    end if;

    update public.users
    set gold_coins = gold_coins - v_item.gold_price
    where id = v_uid;
  else
    if coalesce(v_item.price, 0) <= 0 then
      raise exception 'Invalid price.';
    end if;
    if coalesce(v_user.coins, 0) < v_item.price then
      raise exception 'Insufficient balance.';
    end if;

    update public.users
    set coins = coins - v_item.price
    where id = v_uid;
  end if;

  if v_item.stock is not null then
    update public.shop_items
    set stock = stock - 1
    where id = p_item_id;
  end if;

  insert into public.redemptions (
    id, user_id, item_id, item_name, item_emoji, price, currency, status
  ) values (
    v_redemption_id,
    v_uid,
    v_item.id,
    v_item.name,
    coalesce(v_item.emoji, '[gift]'),
    case when coalesce(v_item.gold_only, false) then v_item.gold_price else v_item.price end,
    case when coalesce(v_item.gold_only, false) then 'gold' else 'coin' end,
    'pending'
  );

  insert into public.transactions (
    id, user_id, type, amount, currency, description, related_id
  ) values (
    v_redemption_id,
    v_uid,
    'shop_purchase',
    -1 * (case when coalesce(v_item.gold_only, false) then v_item.gold_price else v_item.price end),
    case when coalesce(v_item.gold_only, false) then 'gold' else 'coin' end,
    format('Resgate: %s', v_item.name),
    v_item.id
  );

  return jsonb_build_object('success', true, 'redemption_id', v_redemption_id);
end;
$$;

create or replace function public.purchase_gold_package(
  p_package_id text,
  p_sandbox_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_gold_amount bigint := 0;
  v_price_brl numeric := 0;
begin
  if v_uid is null then
    raise exception 'Login required.';
  end if;

  if p_package_id = 'gold_500' then
    v_gold_amount := 500;
    v_price_brl := 5;
  elsif p_package_id = 'gold_1200' then
    v_gold_amount := 1200;
    v_price_brl := 10;
  elsif p_package_id = 'gold_3500' then
    v_gold_amount := 3500;
    v_price_brl := 25;
  else
    raise exception 'Invalid package.';
  end if;

  -- MVP sandbox gate
  if coalesce(p_sandbox_token, '') <> 'sandbox_ok' then
    raise exception 'Payment not validated (sandbox).';
  end if;

  perform set_config('app.bypass_economy_guard', '1', true);

  update public.users
  set gold_coins = gold_coins + v_gold_amount
  where id = v_uid;

  insert into public.transactions (
    user_id, type, amount, currency, description, metadata
  ) values (
    v_uid,
    'gold_purchase',
    v_gold_amount,
    'gold',
    format('Compra de Q$ Gold (%s)', p_package_id),
    jsonb_build_object('package_id', p_package_id, 'price_brl', v_price_brl)
  );

  return jsonb_build_object(
    'success', true,
    'package_id', p_package_id,
    'gold_amount', v_gold_amount,
    'price_brl', v_price_brl
  );
end;
$$;

create or replace function public.claim_ad_reward()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_user public.users%rowtype;
  v_today date := current_date;
  v_ads_today integer := 0;
  v_reward integer := 50;
  v_daily_limit integer := 3;
begin
  if v_uid is null then
    raise exception 'Login required.';
  end if;

  select * into v_user
  from public.users
  where id = v_uid
  for update;

  if not found then
    raise exception 'User profile not found.';
  end if;

  if v_user.ad_view_date = v_today then
    v_ads_today := coalesce(v_user.ad_view_count, 0);
  else
    v_ads_today := 0;
  end if;

  if v_ads_today >= v_daily_limit then
    raise exception 'Daily ad limit reached.';
  end if;

  perform set_config('app.bypass_economy_guard', '1', true);

  update public.users
  set
    coins = coins + v_reward,
    ad_view_date = v_today,
    ad_view_count = v_ads_today + 1
  where id = v_uid;

  insert into public.transactions (
    user_id, type, amount, currency, description
  ) values (
    v_uid,
    'ad_reward',
    v_reward,
    'coin',
    'Video assistido +50 Q$'
  );

  return jsonb_build_object('success', true, 'reward', v_reward);
end;
$$;

create or replace function public.join_group_by_code(
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_group public.groups%rowtype;
  v_code text := upper(trim(coalesce(p_code, '')));
begin
  if v_uid is null then
    raise exception 'Login required.';
  end if;

  if length(v_code) < 4 or length(v_code) > 8 then
    raise exception 'Invalid invite code.';
  end if;

  select * into v_group
  from public.groups
  where invite_code = v_code
  limit 1;

  if not found then
    raise exception 'Group not found.';
  end if;

  insert into public.group_members (group_id, user_id)
  values (v_group.id, v_uid)
  on conflict (group_id, user_id) do nothing;

  return jsonb_build_object('success', true, 'group_id', v_group.id);
end;
$$;

grant execute on function public.place_bet(uuid, public.bet_choice, bigint) to authenticated;
grant execute on function public.record_sponsored_impression(uuid) to authenticated;
grant execute on function public.resolve_event(uuid, public.bet_choice) to authenticated;
grant execute on function public.redeem_shop_item(uuid) to authenticated;
grant execute on function public.purchase_gold_package(text, text) to authenticated;
grant execute on function public.claim_ad_reward() to authenticated;
grant execute on function public.join_group_by_code(text) to authenticated;
```

## Notes

- Este schema ja esta pronto para auth por email/senha (Supabase Auth).
- `users` nao salva telefone; perfil publico fica em `public.users`.
- Campos economicos (`coins`, `gold_coins`, `xp`, `level`, `streak`) estao protegidos por trigger. Atualize esses campos via backend (Edge Functions / RPC com service role).
- Para transformar um usuario em admin, adicione no `app_metadata` do usuario: `{ "role": "admin" }`.
