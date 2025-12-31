-- Remove social media integration tables and columns

-- Drop social_posts table
DROP TABLE IF EXISTS public.social_posts;

-- Drop social_connections table  
DROP TABLE IF EXISTS public.social_connections;

-- Remove zapier_webhook_url column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS zapier_webhook_url;