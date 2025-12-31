-- Create table to store social media connections
CREATE TABLE public.social_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- 'buffer', 'instagram', 'facebook'
  access_token TEXT,
  refresh_token TEXT,
  profile_id TEXT, -- Buffer profile ID
  profile_name TEXT,
  profile_image TEXT,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' -- 'active', 'expired', 'disconnected'
);

-- Create table to store scheduled social posts
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
  connection_id UUID REFERENCES public.social_connections(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_text TEXT NOT NULL,
  hashtags TEXT[],
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'published', 'failed', 'cancelled'
  buffer_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for social_connections
CREATE POLICY "Users can view their own connections"
ON public.social_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections"
ON public.social_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
ON public.social_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
ON public.social_connections FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for social_posts
CREATE POLICY "Users can view their own posts"
ON public.social_posts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own posts"
ON public.social_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.social_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.social_posts FOR DELETE
USING (auth.uid() = user_id);