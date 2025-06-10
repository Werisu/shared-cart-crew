
-- Primeiro, vamos remover as políticas problemáticas
DROP POLICY IF EXISTS "Usuários podem ver listas onde são colaboradores" ON public.shopping_lists;
DROP POLICY IF EXISTS "Usuários podem ver itens de listas onde são colaboradores" ON public.shopping_items;
DROP POLICY IF EXISTS "Colaboradores podem inserir itens" ON public.shopping_items;
DROP POLICY IF EXISTS "Colaboradores podem atualizar itens" ON public.shopping_items;
DROP POLICY IF EXISTS "Colaboradores podem deletar itens" ON public.shopping_items;

-- Criar funções de segurança para evitar recursão
CREATE OR REPLACE FUNCTION public.is_list_collaborator(list_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.list_collaborators 
    WHERE list_collaborators.list_id = is_list_collaborator.list_id 
    AND list_collaborators.user_id = is_list_collaborator.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_list_owner(list_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE shopping_lists.id = is_list_owner.list_id 
    AND shopping_lists.created_by = is_list_owner.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recriar as políticas usando as funções de segurança
CREATE POLICY "Usuários podem ver listas onde são colaboradores" ON public.shopping_lists
  FOR SELECT USING (
    created_by = auth.uid() OR 
    public.is_list_collaborator(id, auth.uid())
  );

CREATE POLICY "Usuários podem ver itens de listas onde são colaboradores" ON public.shopping_items
  FOR SELECT USING (
    public.is_list_owner(list_id, auth.uid()) OR
    public.is_list_collaborator(list_id, auth.uid())
  );

CREATE POLICY "Colaboradores podem inserir itens" ON public.shopping_items
  FOR INSERT WITH CHECK (
    public.is_list_owner(list_id, auth.uid()) OR
    public.is_list_collaborator(list_id, auth.uid())
  );

CREATE POLICY "Colaboradores podem atualizar itens" ON public.shopping_items
  FOR UPDATE USING (
    public.is_list_owner(list_id, auth.uid()) OR
    public.is_list_collaborator(list_id, auth.uid())
  );

CREATE POLICY "Colaboradores podem deletar itens" ON public.shopping_items
  FOR DELETE USING (
    public.is_list_owner(list_id, auth.uid()) OR
    public.is_list_collaborator(list_id, auth.uid())
  );
