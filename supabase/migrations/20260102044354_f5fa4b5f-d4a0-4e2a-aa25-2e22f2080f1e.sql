-- Create table for monthly planners
CREATE TABLE public.monthly_planners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  monthly_goal TEXT NOT NULL,
  calendar_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monthly_planners ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own planners"
ON public.monthly_planners FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own planners"
ON public.monthly_planners FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planners"
ON public.monthly_planners FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planners"
ON public.monthly_planners FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_monthly_planners_updated_at
BEFORE UPDATE ON public.monthly_planners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();