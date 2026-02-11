-- 1. Tạo bucket 'avatars' (nếu chưa có, tạo trong giao diện Supabase Storage)
-- Chạy lệnh này trong SQL Editor của Supabase:
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- 2. Thêm cột avatar_url vào bảng users
alter table public.users
add column if not exists avatar_url text;

-- 3. Thiết lập RLS (Row Level Security) cho Storage
-- Cho phép mọi người (Public) xem ảnh
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Cho phép authenticated user upload ảnh của chính mình
-- Lưu ý: Policy này giả định tên file bắt đầu bằng username hoặc user_id để bảo mật (tùy logic code)
-- Ở đây ta cho phép auth user upload vào bucket 'avatars'
create policy "Authenticated users can upload avatars"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

-- Cho phép user update ảnh (xóa/ghi đè)
create policy "Authenticated users can update avatars"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' );
