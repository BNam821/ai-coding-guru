-- Adds the public read policies that this project actually needs,
-- without removing any existing policies.
-- Private tables stay closed behind server-side service-role access.
-- Run this script in the Supabase SQL Editor.

begin;

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

alter table if exists public.user_course_registrations enable row level security;

alter table if exists public.courses enable row level security;
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'courses'
          and policyname = 'Public read courses'
    ) then
        create policy "Public read courses"
            on public.courses
            for select
            to anon, authenticated
            using (true);
    end if;
end
$$;

alter table if exists public.chapters enable row level security;
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'chapters'
          and policyname = 'Public read chapters'
    ) then
        create policy "Public read chapters"
            on public.chapters
            for select
            to anon, authenticated
            using (true);
    end if;
end
$$;

alter table if exists public.lessons enable row level security;
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'lessons'
          and policyname = 'Public read lessons'
    ) then
        create policy "Public read lessons"
            on public.lessons
            for select
            to anon, authenticated
            using (true);
    end if;
end
$$;

alter table if exists public.wiki_posts enable row level security;
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'wiki_posts'
          and policyname = 'Public read wiki posts'
    ) then
        create policy "Public read wiki posts"
            on public.wiki_posts
            for select
            to anon, authenticated
            using (true);
    end if;
end
$$;

alter table if exists public.wiki_post_edit_history enable row level security;
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'wiki_post_edit_history'
          and policyname = 'Public read wiki post edit history'
    ) then
        create policy "Public read wiki post edit history"
            on public.wiki_post_edit_history
            for select
            to anon, authenticated
            using (true);
    end if;
end
$$;

alter table if exists public.site_announcements enable row level security;
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'site_announcements'
          and policyname = 'Public read site announcements'
    ) then
        create policy "Public read site announcements"
            on public.site_announcements
            for select
            to anon, authenticated
            using (true);
    end if;
end
$$;

update storage.buckets
set public = true
where id = 'avatars';

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'storage'
          and tablename = 'objects'
          and policyname = 'Public read avatars'
    ) then
        create policy "Public read avatars"
            on storage.objects
            for select
            to anon, authenticated
            using (bucket_id = 'avatars');
    end if;
end
$$;

commit;

-- Intentionally left without anon/authenticated policies:
-- public.users
-- public.saved_posts
-- public.user_learning_history
-- public.user_wiki_history
-- public.quiz_scores
-- public.user_course_registrations
-- public.wiki_submissions
--
-- Those tables are private in this project and should be accessed
-- through server-side code using SUPABASE_SERVICE_ROLE_KEY.
