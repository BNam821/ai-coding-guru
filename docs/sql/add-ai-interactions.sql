create extension if not exists pgcrypto;

create table if not exists public.ai_interactions (
    id uuid primary key default gen_random_uuid(),
    username text null,
    task_type text not null check (
        task_type in (
            'learn-ai-question',
            'quiz-generation',
            'dashboard-ai-evaluation',
            'code-evaluation'
        )
    ),
    prompt_id text null,
    endpoint text not null,
    model_provider text not null default 'google',
    model_name text not null,
    status text not null check (status in ('success', 'error')),
    request_payload jsonb not null default '{}'::jsonb,
    metadata jsonb not null default '{}'::jsonb,
    prompt_text text null,
    response_text text null,
    response_payload jsonb null,
    error_message text null,
    duration_ms integer null,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists ai_interactions_username_created_at_idx
on public.ai_interactions (username, created_at desc);

create index if not exists ai_interactions_task_type_created_at_idx
on public.ai_interactions (task_type, created_at desc);

create index if not exists ai_interactions_status_created_at_idx
on public.ai_interactions (status, created_at desc);

create index if not exists ai_interactions_expires_at_idx
on public.ai_interactions (expires_at);

create or replace function public.cleanup_expired_ai_interactions()
returns integer
language plpgsql
as $$
declare
    deleted_count integer;
begin
    with deleted_rows as (
        delete from public.ai_interactions
        where expires_at <= now()
        returning 1
    )
    select count(*) into deleted_count
    from deleted_rows;

    return coalesce(deleted_count, 0);
end;
$$;

do $$
begin
    begin
        create extension if not exists pg_cron;
    exception
        when others then
            raise notice 'pg_cron is unavailable in this project: %', sqlerrm;
    end;

    if exists (select 1 from pg_extension where extname = 'pg_cron') then
        perform cron.unschedule(jobid)
        from cron.job
        where jobname = 'cleanup-ai-interactions-daily';

        perform cron.schedule(
            'cleanup-ai-interactions-daily',
            '13 0 * * *',
            $cron$select public.cleanup_expired_ai_interactions();$cron$
        );
    else
        raise notice 'pg_cron not enabled. Use the admin cleanup endpoint or run select public.cleanup_expired_ai_interactions(); manually.';
    end if;
exception
    when others then
        raise notice 'Unable to create ai_interactions cleanup cron: %', sqlerrm;
end;
$$;
