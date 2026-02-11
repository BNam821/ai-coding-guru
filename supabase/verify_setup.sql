-- RUN THIS IN SUPABASE SQL EDITOR TO VERIFY SETUP

-- 1. Check if 'avatars' bucket exists and is public
select id, name, public, created_at 
from storage.buckets 
where id = 'avatars';

-- 2. Check if 'avatar_url' column exists in 'users' table
select column_name, data_type 
from information_schema.columns 
where table_schema = 'public' 
  and table_name = 'users' 
  and column_name = 'avatar_url';

-- 3. List all policies on storage.objects to see if ours are applied
select * 
from pg_policies 
where schemaname = 'storage' 
  and tablename = 'objects';

-- 4. TEST: Try to insert a file as 'anon' (Should fail if RLS works for anon)
-- We cannot easily test 'authenticated' here without a token, 
-- but ensuring the policies exist is step #1.
