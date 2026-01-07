-- Add position column to checklist_items
ALTER TABLE public.checklist_items 
ADD COLUMN position integer NOT NULL DEFAULT 0;

-- Update existing items to have sequential positions within each event/phase
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id, phase ORDER BY created_at) - 1 as new_pos
  FROM public.checklist_items
)
UPDATE public.checklist_items 
SET position = ranked.new_pos
FROM ranked
WHERE public.checklist_items.id = ranked.id;