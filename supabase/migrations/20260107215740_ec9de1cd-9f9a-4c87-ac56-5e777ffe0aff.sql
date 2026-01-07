-- Add status column to leads table for tracking conversion
ALTER TABLE public.leads 
ADD COLUMN lead_status text NOT NULL DEFAULT 'lead' 
CHECK (lead_status IN ('lead', 'cliente', 'perdido'));