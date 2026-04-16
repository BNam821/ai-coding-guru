-- Fix/Bootstrap script for public.user_problem_history
-- Safe to run multiple times (idempotent)
-- Built from current app usage:
-- - src/lib/coding-problems-service.ts
-- - src/app/api/code-evaluate/route.ts
-- - src/app/api/test/smart-problem/route.ts

begin;

create extension if not exists pgcrypto;

-- 1) Create table if missing
create table if not exists public.user_problem_history (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  problem_id uuid not null,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Add missing columns if table existed but schema was incomplete
alter table public.user_problem_history
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists username text,
  add column if not exists problem_id uuid,
  add column if not exists score integer default 0,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- 3) Required constraints for app logic
alter table public.user_problem_history
  alter column username set not null,
  alter column problem_id set not null,
  alter column score set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_problem_history_username_problem_id_key'
      and conrelid = 'public.user_problem_history'::regclass
  ) then
    alter table public.user_problem_history
      add constraint user_problem_history_username_problem_id_key
      unique (username, problem_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_problem_history_score_check'
      and conrelid = 'public.user_problem_history'::regclass
  ) then
    alter table public.user_problem_history
      add constraint user_problem_history_score_check
      check (score >= 0 and score <= 100);
  end if;
end $$;

-- 4) Helpful indexes for current query patterns
-- getSmartCodingProblem: where username = ? and score = 100 select problem_id
create index if not exists idx_uph_username_score
  on public.user_problem_history (username, score);

-- resetProblemHistory: delete where username = ?
create index if not exists idx_uph_username
  on public.user_problem_history (username);

-- 5) Keep updated_at fresh on updates
create or replace function public.touch_user_problem_history_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_user_problem_history_updated_at on public.user_problem_history;
create trigger trg_touch_user_problem_history_updated_at
before update on public.user_problem_history
for each row
execute function public.touch_user_problem_history_updated_at();

-- 6) Optional FK to coding_problems (only if compatible)
-- App expects coding_problems.id to be uuid.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'coding_problems'
      and column_name = 'id'
      and udt_name = 'uuid'
  ) and not exists (
    select 1
    from pg_constraint
    where conname = 'user_problem_history_problem_id_fkey'
      and conrelid = 'public.user_problem_history'::regclass
  ) then
    alter table public.user_problem_history
      add constraint user_problem_history_problem_id_fkey
      foreign key (problem_id) references public.coding_problems(id)
      on delete cascade;
  end if;
end $$;

-- 7) Access model for current code:
-- coding-problems-service currently uses anon client path in server handlers,
-- so disabling RLS avoids silent read/write failures.
alter table public.user_problem_history disable row level security;

grant select, insert, update, delete on public.user_problem_history to anon, authenticated, service_role;

commit;

-- Verification queries (run manually):
-- select column_name, data_type, udt_name, is_nullable
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'user_problem_history'
-- order by ordinal_position;
--
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.user_problem_history'::regclass;
