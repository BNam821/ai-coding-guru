create extension if not exists pgcrypto;

alter table public.coding_problems
add column if not exists test_volume_class text check (test_volume_class in ('few', 'many')),
add column if not exists test_generation_status text default 'idle' check (test_generation_status in ('idle', 'generating', 'ready', 'failed')),
add column if not exists test_generation_error text,
add column if not exists judge0_language_id integer,
add column if not exists judge0_time_limit_ms integer default 2000,
add column if not exists judge0_memory_limit_kb integer default 128000;

create table if not exists public.coding_problem_test_cases (
    id uuid primary key default gen_random_uuid(),
    problem_id uuid not null references public.coding_problems(id) on delete cascade,
    kind text not null check (kind in ('sample', 'generated_draft', 'official')),
    input_text text not null default '',
    expected_output text not null default '',
    is_hidden boolean not null default true,
    source text not null check (source in ('manual', 'ai', 'solution_code')),
    position integer not null default 0,
    status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
    rationale text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists coding_problem_test_cases_problem_kind_source_position_idx
on public.coding_problem_test_cases (problem_id, kind, source, position);

create index if not exists coding_problem_test_cases_problem_kind_status_idx
on public.coding_problem_test_cases (problem_id, kind, status, position);
