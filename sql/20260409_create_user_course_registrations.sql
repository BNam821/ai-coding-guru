-- Create table for user course registrations used by /learn enrollment flow.
-- Run this script in Supabase SQL Editor.

create table if not exists public.user_course_registrations (
    username text not null,
    course_id text not null,
    registered_at timestamptz not null default now(),
    primary key (username, course_id)
);

create index if not exists idx_user_course_registrations_course_id
    on public.user_course_registrations (course_id);

create index if not exists idx_user_course_registrations_registered_at
    on public.user_course_registrations (registered_at desc);
