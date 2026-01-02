-- Create saved_posts table for explicitly saved content
CREATE TABLE public.saved_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('gerador', 'sugestoes_ia')),
  title TEXT NOT NULL,
  short_caption TEXT,
  expanded_text TEXT,
  hashtags TEXT[] DEFAULT '{}',
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved posts"
ON public.saved_posts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved posts"
ON public.saved_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved posts"
ON public.saved_posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved posts"
ON public.saved_posts
FOR DELETE
USING (auth.uid() = user_id);