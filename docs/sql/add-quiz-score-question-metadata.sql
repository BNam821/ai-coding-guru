alter table public.quiz_scores
add column if not exists question_sources jsonb,
add column if not exists question_payload jsonb;
