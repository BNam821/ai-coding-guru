alter table public.ai_interactions
drop constraint if exists ai_interactions_task_type_check;

alter table public.ai_interactions
add constraint ai_interactions_task_type_check
check (
    task_type in (
        'learn-ai-question',
        'quiz-generation',
        'dashboard-ai-evaluation',
        'code-evaluation',
        'code-test-generation',
        'code-feedback',
        'judge0-execution'
    )
);
