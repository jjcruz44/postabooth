-- Add filter columns to monthly_planners table
ALTER TABLE public.monthly_planners
ADD COLUMN IF NOT EXISTS posting_frequency integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS posting_days text[] DEFAULT ARRAY['segunda', 'quarta', 'sexta']::text[],
ADD COLUMN IF NOT EXISTS content_focus text DEFAULT 'Aleatório',
ADD COLUMN IF NOT EXISTS month_objective text;

-- Update existing rows to have default values
UPDATE public.monthly_planners
SET 
  posting_frequency = COALESCE(posting_frequency, 3),
  posting_days = COALESCE(posting_days, ARRAY['segunda', 'quarta', 'sexta']::text[]),
  content_focus = COALESCE(content_focus, 'Aleatório')
WHERE posting_frequency IS NULL OR posting_days IS NULL OR content_focus IS NULL;