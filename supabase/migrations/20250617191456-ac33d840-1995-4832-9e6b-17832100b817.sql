
-- Criar tabela para gerenciar convites de colaboração
CREATE TABLE public.list_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(list_id, invitee_email)
);

-- Habilitar RLS na tabela de convites
ALTER TABLE public.list_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para list_invitations
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

CREATE POLICY "Convidados podem atualizar seus convites" ON public.list_invitations
  FOR UPDATE USING (
    invitee_id = auth.uid() OR
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = invitee_email
  );

-- Função para aceitar convite e adicionar como colaborador
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record public.list_invitations;
  user_email TEXT;
BEGIN
  -- Buscar o email do usuário atual
  SELECT email INTO user_email FROM public.profiles WHERE id = auth.uid();
  
  -- Buscar o convite
  SELECT * INTO invitation_record 
  FROM public.list_invitations 
  WHERE id = invitation_id 
    AND status = 'pending'
    AND (invitee_id = auth.uid() OR invitee_email = user_email);
  
  IF invitation_record.id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Atualizar o convite
  UPDATE public.list_invitations 
  SET 
    status = 'accepted',
    invitee_id = auth.uid(),
    responded_at = now(),
    updated_at = now()
  WHERE id = invitation_id;
  
  -- Adicionar como colaborador
  INSERT INTO public.list_collaborators (list_id, user_id, role, invited_by)
  VALUES (invitation_record.list_id, auth.uid(), 'collaborator', invitation_record.inviter_id)
  ON CONFLICT (list_id, user_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para recusar convite
CREATE OR REPLACE FUNCTION public.decline_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Buscar o email do usuário atual
  SELECT email INTO user_email FROM public.profiles WHERE id = auth.uid();
  
  UPDATE public.list_invitations 
  SET 
    status = 'declined',
    invitee_id = auth.uid(),
    responded_at = now(),
    updated_at = now()
  WHERE id = invitation_id 
    AND status = 'pending'
    AND (invitee_id = auth.uid() OR invitee_email = user_email);
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
