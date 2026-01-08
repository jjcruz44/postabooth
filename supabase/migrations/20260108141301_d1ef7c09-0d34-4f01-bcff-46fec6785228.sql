-- Remover políticas existentes da tabela leads
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- Garantir que RLS está ativado e forçado
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- Criar novas políticas PERMISSIVE apenas para usuários autenticados
-- Cada usuário só pode ver seus próprios leads
CREATE POLICY "Authenticated users can view own leads"
ON public.leads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Cada usuário só pode criar leads vinculados a si mesmo
CREATE POLICY "Authenticated users can create own leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Cada usuário só pode atualizar seus próprios leads
CREATE POLICY "Authenticated users can update own leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Cada usuário só pode deletar seus próprios leads
CREATE POLICY "Authenticated users can delete own leads"
ON public.leads
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);