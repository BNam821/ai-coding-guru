alter table public.lessons
add column if not exists ai_question_enabled boolean not null default false;

comment on column public.lessons.ai_question_enabled is
'Admin toggle: when true, the lesson page can show AI-generated inline questions.';
