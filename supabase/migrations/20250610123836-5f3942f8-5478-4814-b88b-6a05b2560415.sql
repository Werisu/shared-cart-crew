
-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Criar tabela de listas de compras
CREATE TABLE public.shopping_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'blue',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de itens das listas
CREATE TABLE public.shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de colaboradores das listas (para compartilhamento)
CREATE TABLE public.list_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(list_id, user_id)
);

-- Habilitar RLS (Row Level Security) em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_collaborators ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver todos os perfis" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas RLS para shopping_lists
CREATE POLICY "Usuários podem ver listas onde são colaboradores" ON public.shopping_lists
  FOR SELECT USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.list_collaborators 
      WHERE list_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar suas próprias listas" ON public.shopping_lists
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Proprietários podem atualizar suas listas" ON public.shopping_lists
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Proprietários podem deletar suas listas" ON public.shopping_lists
  FOR DELETE USING (created_by = auth.uid());

-- Políticas RLS para shopping_items
CREATE POLICY "Usuários podem ver itens de listas onde são colaboradores" ON public.shopping_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists sl
      LEFT JOIN public.list_collaborators lc ON sl.id = lc.list_id
      WHERE sl.id = list_id AND (sl.created_by = auth.uid() OR lc.user_id = auth.uid())
    )
  );

CREATE POLICY "Colaboradores podem inserir itens" ON public.shopping_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shopping_lists sl
      LEFT JOIN public.list_collaborators lc ON sl.id = lc.list_id
      WHERE sl.id = list_id AND (sl.created_by = auth.uid() OR lc.user_id = auth.uid())
    )
  );

CREATE POLICY "Colaboradores podem atualizar itens" ON public.shopping_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists sl
      LEFT JOIN public.list_collaborators lc ON sl.id = lc.list_id
      WHERE sl.id = list_id AND (sl.created_by = auth.uid() OR lc.user_id = auth.uid())
    )
  );

CREATE POLICY "Colaboradores podem deletar itens" ON public.shopping_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists sl
      LEFT JOIN public.list_collaborators lc ON sl.id = lc.list_id
      WHERE sl.id = list_id AND (sl.created_by = auth.uid() OR lc.user_id = auth.uid())
    )
  );

-- Políticas RLS para list_collaborators
CREATE POLICY "Usuários podem ver colaboradores de suas listas" ON public.list_collaborators
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.shopping_lists 
      WHERE id = list_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Proprietários podem gerenciar colaboradores" ON public.list_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists 
      WHERE id = list_id AND created_by = auth.uid()
    )
  );

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger para adicionar o criador como colaborador proprietário
CREATE OR REPLACE FUNCTION public.handle_new_list()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.list_collaborators (list_id, user_id, role)
  VALUES (new.id, new.created_by, 'owner');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_shopping_list_created
  AFTER INSERT ON public.shopping_lists
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_list();
