-- Add zapier_webhook_url column to profiles table for Buffer integration via Zapier
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zapier_webhook_url text;