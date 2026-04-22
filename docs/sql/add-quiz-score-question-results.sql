alter table public.quiz_scores
add column if not exists question_results jsonb;
