-- Create quiz_scores table
CREATE TABLE IF NOT EXISTS public.quiz_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable insert for authenticated users" ON public.quiz_scores
    FOR INSERT WITH CHECK (true); -- We will verify username in the API route

CREATE POLICY "Enable select for users to see their own scores" ON public.quiz_scores
    FOR SELECT USING (true); -- We will filter by username in the API/Server Component
