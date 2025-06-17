
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
      console.log('Enviando convite:', {
        listId,
        inviter_id: user.id,
        invitee_email: email.toLowerCase().trim()
      });

      const { data, error } = await supabase
        .from('list_invitations')
        .insert({
          list_id: listId,
          inviter_id: user.id,
          invitee_email: email.toLowerCase().trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir convite:', error);
        if (error.code === '23505') {
          toast({
            title: "Convite já enviado",
            description: "Este usuário já foi convidado para esta lista",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        console.log('Convite criado com sucesso:', data);
        toast({
          title: "Convite enviado!",
          description: `Convite enviado para ${email}`
        });
        setEmail('');
        onClose();
      }
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
            Convide alguém para colaborar na lista "{listName}"
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
