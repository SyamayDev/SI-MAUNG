-- SI-MAUNG core schema: profiles, transactions, savings_goals.
--
-- Idempotent and NON-DESTRUCTIVE by design — safe to run on a database that
-- already has these tables:
--   * creates tables/columns/indexes only if they are missing (never drops)
--   * new CHECK constraints are added NOT VALID: enforced for new/updated rows,
--     existing rows are left untouched
--   * only policies/triggers/functions named simaung_* are (re)created;
--     anything else that already exists is left as it is
--   * no rows are inserted, updated or deleted
-- Review existing policies with supabase/scripts/audit_policies.sql afterwards:
-- RLS policies are OR-ed, so an older permissive policy (e.g. USING (true))
-- would still expose data and must be removed manually.

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- ------------------------------------------------------------ transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null,
  amount numeric(15, 2) not null,
  description text not null,
  category text not null default 'other',
  transaction_date date not null default current_date,
  notes text,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Columns the app writes that older versions of the table may lack. A new
-- column is added WITHOUT a default first, so existing rows stay NULL
-- ("unknown") instead of being labelled with a value they never had; the
-- default only applies to rows inserted afterwards.
alter table public.transactions add column if not exists notes text;
alter table public.transactions add column if not exists source text;
alter table public.transactions alter column source set default 'manual';
-- Inserts without an explicit owner belong to the caller (RLS still checks it).
alter table public.transactions alter column user_id set default auth.uid();
alter table public.transactions add column if not exists created_at timestamptz not null default now();
alter table public.transactions add column if not exists updated_at timestamptz not null default now();

create index if not exists transactions_user_date_idx on public.transactions (user_id, transaction_date desc, created_at desc);

-- ----------------------------------------------------------- savings_goals
-- current_amount is the single source of truth for a goal's progress;
-- deposits/withdrawals update it directly (they are not transactions).
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(15, 2) not null,
  current_amount numeric(15, 2) not null default 0,
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.savings_goals add column if not exists current_amount numeric(15, 2) not null default 0;
alter table public.savings_goals alter column user_id set default auth.uid();
alter table public.savings_goals add column if not exists deadline date;
alter table public.savings_goals add column if not exists created_at timestamptz not null default now();
alter table public.savings_goals add column if not exists updated_at timestamptz not null default now();

create index if not exists savings_goals_user_idx on public.savings_goals (user_id, created_at desc);

-- ------------------------------------------------- data rules (new rows only)
do $$
declare
  rules text[][] := array[
    ['transactions', 'simaung_tx_type_check', 'check (type in (''income'', ''expense''))'],
    ['transactions', 'simaung_tx_amount_check', 'check (amount > 0 and amount <= 1000000000000)'],
    ['transactions', 'simaung_tx_description_check', 'check (char_length(btrim(description)) between 1 and 120)'],
    ['transactions', 'simaung_tx_category_check', 'check (category in (''food'', ''transportation'', ''shopping'', ''bills'', ''entertainment'', ''health'', ''education'', ''family'', ''salary'', ''gift'', ''other''))'],
    ['transactions', 'simaung_tx_source_check', 'check (source is null or source in (''manual'', ''voice'', ''text'', ''ai''))'],
    ['transactions', 'simaung_tx_notes_check', 'check (notes is null or char_length(notes) <= 500)'],
    ['savings_goals', 'simaung_goal_target_check', 'check (target_amount > 0 and target_amount <= 1000000000000)'],
    ['savings_goals', 'simaung_goal_current_check', 'check (current_amount >= 0)'],
    ['savings_goals', 'simaung_goal_name_check', 'check (char_length(btrim(name)) between 1 and 60)']
  ];
  r text[];
begin
  foreach r slice 1 in array rules loop
    if not exists (
      select 1 from pg_constraint
      where conname = r[2] and conrelid = format('public.%I', r[1])::regclass
    ) then
      execute format('alter table public.%I add constraint %I %s not valid', r[1], r[2], r[3]);
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------- updated_at
create or replace function public.simaung_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger simaung_profiles_updated_at before update on public.profiles
  for each row execute function public.simaung_set_updated_at();
create or replace trigger simaung_transactions_updated_at before update on public.transactions
  for each row execute function public.simaung_set_updated_at();
create or replace trigger simaung_savings_goals_updated_at before update on public.savings_goals
  for each row execute function public.simaung_set_updated_at();

-- ------------------------------------------- profile row for every new user
create or replace function public.simaung_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.simaung_handle_new_user() from public, anon, authenticated;

create or replace trigger simaung_on_auth_user_created
  after insert on auth.users
  for each row execute function public.simaung_handle_new_user();

-- --------------------------------------------------- Row Level Security
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.savings_goals enable row level security;

-- Signed-out visitors never touch financial tables.
revoke all on table public.profiles, public.transactions, public.savings_goals from anon;
grant select, insert, update, delete on table public.transactions, public.savings_goals to authenticated;
grant select, insert, update on table public.profiles to authenticated;

-- profiles: a user sees and edits only their own row (deleted with the auth user).
drop policy if exists simaung_profiles_select on public.profiles;
create policy simaung_profiles_select on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists simaung_profiles_insert on public.profiles;
create policy simaung_profiles_insert on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists simaung_profiles_update on public.profiles;
create policy simaung_profiles_update on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- transactions: full CRUD on own rows; ownership cannot be moved to someone else.
drop policy if exists simaung_transactions_select on public.transactions;
create policy simaung_transactions_select on public.transactions
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists simaung_transactions_insert on public.transactions;
create policy simaung_transactions_insert on public.transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists simaung_transactions_update on public.transactions;
create policy simaung_transactions_update on public.transactions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists simaung_transactions_delete on public.transactions;
create policy simaung_transactions_delete on public.transactions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- savings_goals: same ownership rules.
drop policy if exists simaung_goals_select on public.savings_goals;
create policy simaung_goals_select on public.savings_goals
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists simaung_goals_insert on public.savings_goals;
create policy simaung_goals_insert on public.savings_goals
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists simaung_goals_update on public.savings_goals;
create policy simaung_goals_update on public.savings_goals
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists simaung_goals_delete on public.savings_goals;
create policy simaung_goals_delete on public.savings_goals
  for delete to authenticated using ((select auth.uid()) = user_id);
