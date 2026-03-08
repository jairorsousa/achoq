-- Multi-option events migration (Supabase/Postgres)
-- Run once on an existing database that still uses single-market events.

begin;

create table if not exists public.event_options (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  sim_pool bigint not null default 0 check (sim_pool >= 0),
  nao_pool bigint not null default 0 check (nao_pool >= 0),
  total_bets integer not null default 0 check (total_bets >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id, label)
);

alter table public.events
  add column if not exists winner_option_id uuid;

alter table public.events
  drop column if exists result;

alter table public.bets
  add column if not exists option_id uuid;

-- Creates a default option for events that still do not have alternatives.
insert into public.event_options (
  event_id,
  label,
  sort_order,
  sim_pool,
  nao_pool,
  total_bets,
  active
)
select
  e.id,
  'Mercado principal',
  0,
  coalesce(e.sim_count, 0),
  coalesce(e.nao_count, 0),
  coalesce(e.total_bets, 0),
  true
from public.events e
where not exists (
  select 1
  from public.event_options eo
  where eo.event_id = e.id
);

-- Backfill existing bets to the default option.
update public.bets b
set option_id = eo.id
from public.event_options eo
where b.option_id is null
  and eo.event_id = b.event_id
  and eo.sort_order = 0;

do $$
begin
  if exists (select 1 from public.bets where option_id is null) then
    raise exception 'Migration failed: some bets are still without option_id.';
  end if;
end $$;

alter table public.bets
  alter column option_id set not null;

alter table public.bets
  drop constraint if exists bets_user_id_event_id_key;
alter table public.bets
  drop constraint if exists bets_option_id_fkey;
alter table public.bets
  add constraint bets_option_id_fkey
  foreign key (option_id) references public.event_options(id) on delete cascade;
alter table public.bets
  drop constraint if exists bets_user_id_option_id_key;
alter table public.bets
  add constraint bets_user_id_option_id_key unique (user_id, option_id);

alter table public.events
  drop constraint if exists events_winner_option_id_fkey;
alter table public.events
  add constraint events_winner_option_id_fkey
  foreign key (winner_option_id) references public.event_options(id) on delete set null;

create index if not exists idx_event_options_event_sort on public.event_options (event_id, sort_order);
create index if not exists idx_bets_option_status on public.bets (option_id, status);

alter table public.event_options enable row level security;

drop policy if exists event_options_select_authenticated on public.event_options;
create policy event_options_select_authenticated
on public.event_options
for select
to authenticated
using (true);

drop policy if exists event_options_write_admin on public.event_options;
create policy event_options_write_admin
on public.event_options
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

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
    from public.event_options eo
    where eo.id = option_id
      and eo.event_id = event_id
      and eo.active = true
  )
  and exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.status = 'open'
      and e.closes_at > now()
  )
);

drop function if exists public.place_bet(uuid, public.bet_choice, bigint);
drop function if exists public.resolve_event(uuid, public.bet_choice);

create or replace function public.place_bet(
  p_event_id uuid,
  p_option_id uuid,
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
  v_option public.event_options%rowtype;
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

  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found.';
  end if;

  if v_event.status <> 'open' or v_event.closes_at <= now() then
    raise exception 'Event is closed.';
  end if;

  select * into v_option
  from public.event_options
  where id = p_option_id
    and event_id = p_event_id
  for update;

  if not found then
    raise exception 'Option not found for this event.';
  end if;

  if not coalesce(v_option.active, true) then
    raise exception 'Option is not active.';
  end if;

  if exists (
    select 1
    from public.bets
    where user_id = v_uid
      and option_id = p_option_id
  ) then
    raise exception 'You already placed a bet on this option.';
  end if;

  select * into v_user
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
    id, user_id, event_id, option_id, choice, amount, status
  ) values (
    v_bet_id, v_uid, p_event_id, p_option_id, p_choice, p_amount, 'pending'
  );

  update public.event_options
  set
    sim_pool = sim_pool + case when p_choice = 'sim' then p_amount else 0 end,
    nao_pool = nao_pool + case when p_choice = 'nao' then p_amount else 0 end,
    total_bets = total_bets + 1
  where id = p_option_id;

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
    format('Aposta em "%s" - %s (%s)', v_event.title, v_option.label, upper(p_choice::text)),
    p_event_id
  );

  return jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'transaction_id', v_tx_id
  );
end;
$$;

create or replace function public.resolve_event(
  p_event_id uuid,
  p_winner_option_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_winner_option public.event_options%rowtype;
  v_bet record;
  v_is_winner boolean;
  v_option_label text;
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

  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found.';
  end if;

  if v_event.status <> 'open' then
    raise exception 'Event is not open.';
  end if;

  select * into v_winner_option
  from public.event_options
  where id = p_winner_option_id
    and event_id = p_event_id
  for update;

  if not found then
    raise exception 'Winner option not found for this event.';
  end if;

  for v_bet in
    select *
    from public.bets
    where event_id = p_event_id
      and status = 'pending'
    for update
  loop
    v_total_pot := v_total_pot + coalesce(v_bet.amount, 0);
    v_is_winner := (
      (v_bet.option_id = p_winner_option_id and v_bet.choice = 'sim')
      or
      (v_bet.option_id <> p_winner_option_id and v_bet.choice = 'nao')
    );

    if v_is_winner then
      v_winners_total := v_winners_total + coalesce(v_bet.amount, 0);
      v_winners_count := v_winners_count + 1;
    else
      v_losers_count := v_losers_count + 1;
    end if;
  end loop;

  if v_total_pot = 0 then
    update public.events
    set status = 'resolved', winner_option_id = p_winner_option_id, resolved_at = now()
    where id = p_event_id;

    return jsonb_build_object(
      'resolved', true,
      'winnerOptionId', p_winner_option_id,
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
    v_is_winner := (
      (v_bet.option_id = p_winner_option_id and v_bet.choice = 'sim')
      or
      (v_bet.option_id <> p_winner_option_id and v_bet.choice = 'nao')
    );

    select eo.label into v_option_label
    from public.event_options eo
    where eo.id = v_bet.option_id;

    if v_is_winner then
      if v_winners_total > 0 then
        v_payout := floor(v_net_pot::numeric * (v_bet.amount::numeric / v_winners_total::numeric));
      else
        v_payout := 0;
      end if;

      update public.bets
      set status = 'won', payout = v_payout, resolved_at = now()
      where id = v_bet.id;

      update public.users
      set coins = coins + v_payout, xp = xp + 25
      where id = v_bet.user_id;

      insert into public.transactions (
        user_id, type, amount, currency, description, related_id
      ) values (
        v_bet.user_id,
        'bet_won',
        v_payout,
        'coin',
        format(
          'Acertou e ganhou %s Q$ no evento "%s" (opcao: %s)',
          v_payout,
          v_event.title,
          coalesce(v_option_label, 'N/D')
        ),
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
  set status = 'resolved', winner_option_id = p_winner_option_id, resolved_at = now()
  where id = p_event_id;

  return jsonb_build_object(
    'resolved', true,
    'winnerOptionId', p_winner_option_id,
    'winnersCount', v_winners_count,
    'losersCount', v_losers_count,
    'totalPot', v_total_pot,
    'rakeAmount', v_rake_amount,
    'netPot', v_net_pot
  );
end;
$$;

grant execute on function public.place_bet(uuid, uuid, public.bet_choice, bigint) to authenticated;
grant execute on function public.resolve_event(uuid, uuid) to authenticated;

commit;
