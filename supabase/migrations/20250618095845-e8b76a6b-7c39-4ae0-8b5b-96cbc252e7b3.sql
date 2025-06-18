
-- Primeiro, vamos remover as políticas existentes para recriá-las
DROP POLICY IF EXISTS "Proprietários podem ver convites de suas listas" ON public.list_invitations;
DROP POLICY IF EXISTS "Proprietários podem criar convites" ON public.list_invitations;
DROP POLICY IF EXISTS "Proprietários podem deletar convites" ON public.list_invitations;
DROP POLICY IF EXISTS "Convidados podem atualizar seus convites" ON public.list_invitations;

-- Agora criar as políticas corretas
CREATE POLICY "Proprietários podem ver convites de suas listas" ON public.list_invitations
  FOR SELECT USING (
    public.is_list_owner(list_id, auth.uid()) OR
    invitee_id = auth.uid() OR
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = invitee_email
  );

CREATE POLICY "Proprietários podem criar convites" ON public.list_invitations
  FOR INSERT WITH CHECK (
    public.is_list_owner(list_id, auth.uid())
  );

CREATE POLICY "Proprietários podem deletar convites" ON public.list_invitations
  FOR DELETE USING (
    public.is_list_owner(list_id, auth.uid())
  );

CREATE POLICY "Convidados podem atualizar seus convites" ON public.list_invitations
  FOR UPDATE USING (
    invitee_id = auth.uid() OR
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = invitee_email
  );
