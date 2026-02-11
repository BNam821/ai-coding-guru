-- Add location column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Việt Nam';
