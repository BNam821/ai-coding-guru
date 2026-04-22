create table if not exists public.dashboard_ai_evaluations (
    username text primary key,
    data_signature text not null,
    evaluation_payload jsonb not null,
    updated_at timestamptz not null default now()
);

create index if not exists dashboard_ai_evaluations_signature_idx
on public.dashboard_ai_evaluations (data_signature);
