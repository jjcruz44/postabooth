-- Drop existing policies on leads table
DROP POLICY IF EXISTS "Authenticated users can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can create own leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete own leads" ON public.leads;

-- Ensure RLS is enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too (extra security)
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- Revoke all access from anon role explicitly
REVOKE ALL ON public.leads FROM anon;

-- Grant access only to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- Create new restrictive policies for authenticated users only
CREATE POLICY "Authenticated users can view own leads"
ON public.leads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create own leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own leads"
ON public.leads
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);