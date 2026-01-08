-- Add new columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido')),
ADD COLUMN IF NOT EXISTS notes text;

-- Create event_payments table
CREATE TABLE public.event_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  total_value numeric NOT NULL DEFAULT 0,
  received_value numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_payments
CREATE POLICY "Users can view their own event payments" 
ON public.event_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own event payments" 
ON public.event_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event payments" 
ON public.event_payments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event payments" 
ON public.event_payments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_event_payments_updated_at
BEFORE UPDATE ON public.event_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();