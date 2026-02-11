-- Xóa policy cũ nếu có để tránh conflict
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Authenticated users can update avatars" on storage.objects;
drop policy if exists "Authenticated users can do everything" on storage.objects;

-- Đảm bảo bucket tồn tại và là public
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 1. Cho phép Public xem ảnh (SELECT)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 2. Cho phép Authenticated User làm mọi thứ (INSERT, UPDATE, DELETE)
-- Điều này sửa lỗi "new row violates..." khi user cố ghi đè file hoặc upload file mới
create policy "Authenticated users can do everything"
on storage.objects for all
to authenticated
using ( bucket_id = 'avatars' )
with check ( bucket_id = 'avatars' );
