-- Add event_date and event_city columns to leads table
ALTER TABLE public.leads 
ADD COLUMN event_date date DEFAULT NULL,
ADD COLUMN event_city text DEFAULT NULL;