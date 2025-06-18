
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Users, Bell } from 'lucide-react';

interface ReceivedInvitation {
  id: string;
  list_id: string;
  inviter_id: string;
  invited_at: string;
  shopping_lists: {
    name: string;
    description: string;
  };
  inviter_profile: {
    name: string;
    email: string;
  } | null;
}

export const InvitationNotifications: React.FC = () => {
  const [invitations, setInvitations] = useState<ReceivedInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      console.log('Buscando convites para usuário:', user.id);

      const { data, error } = await supabase
        .from('list_invitations')
        .select(`
          id,
          list_id,
          inviter_id,
          invited_at,
          shopping_lists!inner(name, description)
        `)
        .eq('status', 'pending')
        .eq('invitee_id', user.id)
        .order('invited_at', { ascending: false });

      if (error) throw error;

      console.log('Convites encontrados:', data);

      // Buscar perfis dos convidadores
      const invitationsWithProfiles = await Promise.all(
        (data || []).map(async (invitation) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', invitation.inviter_id)
            .single();

          return {
            ...invitation,
            inviter_profile: profile
          };
        })
      );

      setInvitations(invitationsWithProfiles as ReceivedInvitation[]);
    } catch (error) {
      console.error('Erro ao buscar convites recebidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    setProcessingIds(prev => new Set(prev).add(invitationId));

    try {
      console.log(`Processando convite ${invitationId} - ação: ${action}`);
      console.log('Usuário atual:', user?.id);

      const { data, error } = await supabase.rpc(
        action === 'accept' ? 'accept_invitation' : 'decline_invitation',
        { invitation_id: invitationId }
      );

      if (error) {
        console.error(`Erro ao ${action === 'accept' ? 'aceitar' : 'recusar'} convite:`, error);
        throw error;
      }

      console.log(`Resultado da função ${action === 'accept' ? 'accept_invitation' : 'decline_invitation'}:`, data);

      if (data) {
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
        toast({
          title: action === 'accept' ? "Convite aceito!" : "Convite recusado",
          description: action === 'accept' 
            ? "Você agora é colaborador desta lista" 
            : "O convite foi recusado"
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível processar o convite",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao processar convite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o convite",
        variant: "destructive"
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchInvitations();
    
    // Configurar listener para atualizações em tempo real
    const channel = supabase
      .channel('invitation-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'list_invitations',
          filter: `invitee_id=eq.${user?.id}`
        },
        () => {
          console.log('Novo convite recebido, atualizando lista...');
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Verificando convites...</p>
      </div>
    );
  }

  if (invitations.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Convites Recebidos ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-blue-50"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{invitation.shopping_lists.name}</p>
                  <p className="text-sm text-gray-600">
                    {invitation.shopping_lists.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    Convite de {invitation.inviter_profile?.name || invitation.inviter_profile?.email || 'Usuário desconhecido'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleInvitation(invitation.id, 'accept')}
                  disabled={processingIds.has(invitation.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInvitation(invitation.id, 'decline')}
                  disabled={processingIds.has(invitation.id)}
                >
                  <X className="h-4 w-4" />
                  Recusar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
