-- Add ideia column to saved_posts table for storing the main idea
ALTER TABLE public.saved_posts 
ADD COLUMN ideia text;