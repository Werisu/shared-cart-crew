
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Clock, Mail, X } from 'lucide-react';

interface Invitation {
  id: string;
  invitee_id: string;
  invitee_email: string;
  invited_at: string;
  status: string;
  invitee_profile: {
    name: string;
    email: string;
  } | null;
}

interface PendingInvitationsProps {
  listId: string;
  onInvitationUpdate?: () => void;
}

export const PendingInvitations: React.FC<PendingInvitationsProps> = ({
  listId,
  onInvitationUpdate
}) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      console.log('Buscando convites pendentes para lista:', listId);
      const { data, error } = await supabase
        .from('list_invitations')
        .select('id, invitee_id, invitee_email, invited_at, status')
        .eq('list_id', listId)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar convites pendentes:', error);
        throw error;
      }
      
      console.log('Convites pendentes encontrados:', data);

      // Buscar informações dos usuários convidados
      const invitationsWithProfiles = await Promise.all(
        (data || []).map(async (invitation) => {
          if (invitation.invitee_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', invitation.invitee_id)
              .single();

            return {
              ...invitation,
              invitee_profile: profile
            };
          }
          return {
            ...invitation,
            invitee_profile: null
          };
        })
      );

      setInvitations(invitationsWithProfiles as Invitation[]);
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      console.log('Tentando cancelar convite:', invitationId);

      const { error } = await supabase
        .from('list_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Erro ao deletar convite:', error);
        throw error;
      }

      console.log('Convite deletado com sucesso');
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado com sucesso"
      });
      onInvitationUpdate?.();
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o convite",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [listId, user]);

  if (loading) return null;

  if (invitations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Convites Pendentes ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {invitation.invitee_profile?.name || invitation.invitee_profile?.email || invitation.invitee_email}
                  </p>
                  <p className="text-sm text-gray-500">
                    Enviado em {new Date(invitation.invited_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cancelInvitation(invitation.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
