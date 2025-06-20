
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Mail, Clock } from 'lucide-react';

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

export const ReceivedInvitations: React.FC = () => {
  const [invitations, setInvitations] = useState<ReceivedInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      console.log('Buscando convites recebidos para usuário:', user.id);

      // Primeiro, buscar os convites básicos
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('list_invitations')
        .select('*')
        .eq('status', 'pending')
        .eq('invitee_id', user.id)
        .order('invited_at', { ascending: false });

      if (invitationsError) {
        console.error('Erro ao buscar convites:', invitationsError);
        throw invitationsError;
      }

      console.log('Convites básicos encontrados:', invitationsData);

      if (!invitationsData || invitationsData.length === 0) {
        console.log('Nenhum convite encontrado para o usuário');
        setInvitations([]);
        return;
      }

      // Buscar informações das listas e perfis dos convidadores
      const invitationsWithDetails = await Promise.all(
        invitationsData.map(async (invitation) => {
          // Buscar informações da lista
          const { data: listData } = await supabase
            .from('shopping_lists')
            .select('name, description')
            .eq('id', invitation.list_id)
            .single();

          // Buscar perfil do convidador
          const { data: inviterProfile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', invitation.inviter_id)
            .single();

          return {
            ...invitation,
            shopping_lists: listData || { name: 'Lista não encontrada', description: '' },
            inviter_profile: inviterProfile
          };
        })
      );

      console.log('Convites com detalhes:', invitationsWithDetails);
      setInvitations(invitationsWithDetails as ReceivedInvitation[]);
    } catch (error) {
      console.error('Erro ao buscar convites recebidos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os convites",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    setProcessingIds(prev => new Set(prev).add(invitationId));

    try {
      console.log(`${action === 'accept' ? 'Aceitando' : 'Recusando'} convite:`, invitationId);

      const { data, error } = await supabase.rpc(
        action === 'accept' ? 'accept_invitation' : 'decline_invitation',
        { invitation_id: invitationId }
      );

      if (error) {
        console.error(`Erro ao ${action === 'accept' ? 'aceitar' : 'recusar'} convite:`, error);
        throw error;
      }

      console.log(`Resultado da ação ${action}:`, data);

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
      .channel('received-invitations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'list_invitations',
          filter: `invitee_id=eq.${user?.id}`
        },
        () => {
          console.log('Novo convite recebido, atualizando...');
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convites Recebidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Carregando convites...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convites Recebidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum convite pendente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Convites Recebidos ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {invitation.shopping_lists.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {invitation.shopping_lists.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Convite de {invitation.inviter_profile?.name || invitation.inviter_profile?.email || 'Usuário'} • {' '}
                    {new Date(invitation.invited_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleInvitation(invitation.id, 'accept')}
                  disabled={processingIds.has(invitation.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInvitation(invitation.id, 'decline')}
                  disabled={processingIds.has(invitation.id)}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
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
