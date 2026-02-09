-- Tạo bảng courses (Khoá học/Danh mục chính)
CREATE TABLE public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tạo bảng chapters (Chương/Phần)
CREATE TABLE public.chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tạo bảng lessons (Bài học)
CREATE TABLE public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT, -- Nội dung Markdown
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(chapter_id, slug) -- Slug là duy nhất trong cùng 1 chapter (hoặc có thể để unique global nếu muốn)
);

-- Bật Row Level Security (RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Tạo Policy: Tất cả mọi người đều có thể XEM (SELECT)
CREATE POLICY "Public courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public chapters are viewable by everyone" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Public lessons are viewable by everyone" ON public.lessons FOR SELECT USING (true);

-- Tạo Policy: Chỉ Service Role (hoặc Admin) mới được THÊM/SỬA/XOÁ
-- (Mặc định RLS chặn write nếu không có policy, nên chỉ cần policy SELECT là đủ cho user thường)
-- Nếu muốn Admin sửa được từ Dashboard, cần thêm Policy cho role 'service_role' hoặc check uid

-- Insert dữ liệu mẫu (Seed Data)
INSERT INTO public.courses (title, slug, description, "order") VALUES
('Giới thiệu', 'intro', 'Giới thiệu về hệ thống học tập', 1),
('React Cơ bản', 'react-basic', 'Khoá học React dành cho người mới bắt đầu', 2);

-- Lấy ID của khoá 'Giới thiệu' để insert chương
DO $$
DECLARE
    course_intro_id UUID;
    course_react_id UUID;
    chapter_overview_id UUID;
BEGIN
    SELECT id INTO course_intro_id FROM public.courses WHERE slug = 'intro';
    SELECT id INTO course_react_id FROM public.courses WHERE slug = 'react-basic';

    -- Insert Chapter cho Intro
    INSERT INTO public.chapters (course_id, title, "order") VALUES (course_intro_id, 'Tổng quan', 1) RETURNING id INTO chapter_overview_id;

    -- Insert Lesson cho Intro
    INSERT INTO public.lessons (chapter_id, title, slug, content, "order") VALUES
    (chapter_overview_id, 'Chào mừng', 'welcome', '# Chào mừng bạn đến với khoá học!\n\nĐây là bài học đầu tiên.', 1),
    (chapter_overview_id, 'Cài đặt môi trường', 'setup', '# Cài đặt môi trường\n\nHướng dẫn cài đặt Node.js và VS Code.', 2);

END $$;
