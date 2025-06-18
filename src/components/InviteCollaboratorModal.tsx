
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2 } from 'lucide-react';

interface InviteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
}

export const InviteCollaboratorModal: React.FC<InviteCollaboratorModalProps> = ({
  isOpen,
  onClose,
  listId,
  listName
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!user || !email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Buscando usuário por email:', email.toLowerCase().trim());

      // Primeiro, verificar se o usuário existe no sistema
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (userError || !targetUser) {
        toast({
          title: "Usuário não encontrado",
          description: "Este email não está cadastrado no sistema",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.log('Usuário encontrado:', targetUser);

      // Verificar se o usuário já é colaborador da lista
      const { data: existingCollaborator, error: collabError } = await supabase
        .from('list_collaborators')
        .select('id')
        .eq('list_id', listId)
        .eq('user_id', targetUser.id)
        .single();

      if (collabError && collabError.code !== 'PGRST116') {
        console.error('Erro ao verificar colaborador existente:', collabError);
        throw collabError;
      }

      if (existingCollaborator) {
        toast({
          title: "Usuário já é colaborador",
          description: "Este usuário já tem acesso a esta lista",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Verificar se já existe um convite pendente
      const { data: existingInvite, error: checkError } = await supabase
        .from('list_invitations')
        .select('id')
        .eq('list_id', listId)
        .eq('invitee_id', targetUser.id)
        .eq('status', 'pending')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar convite existente:', checkError);
        throw checkError;
      }

      if (existingInvite) {
        toast({
          title: "Convite já enviado",
          description: "Este usuário já foi convidado para esta lista",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Criar o convite
      const { data, error } = await supabase
        .from('list_invitations')
        .insert({
          list_id: listId,
          inviter_id: user.id,
          invitee_id: targetUser.id,
          invitee_email: targetUser.email
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir convite:', error);
        throw error;
      }

      console.log('Convite criado com sucesso:', data);
      toast({
        title: "Convite enviado!",
        description: `Convite enviado para ${targetUser.name || targetUser.email}`
      });
      setEmail('');
      onClose();
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o convite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convidar Colaborador
          </DialogTitle>
          <DialogDescription>
            Digite o email do usuário que você quer convidar para colaborar na lista "{listName}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email do colaborador</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleInvite} disabled={loading || !email.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Convite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
