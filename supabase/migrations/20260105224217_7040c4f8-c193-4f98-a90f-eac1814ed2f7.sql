-- Add scheduled_date column to saved_posts table
ALTER TABLE public.saved_posts 
ADD COLUMN scheduled_date date;