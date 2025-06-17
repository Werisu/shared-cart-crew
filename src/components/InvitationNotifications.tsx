
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
  profiles: {
    name: string;
    email: string;
  };
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
      const { data, error } = await supabase
        .from('list_invitations')
        .select(`
          id,
          list_id,
          inviter_id,
          invited_at,
          shopping_lists!inner(name, description),
          profiles!list_invitations_inviter_id_fkey(name, email)
        `)
        .eq('status', 'pending')
        .or(`invitee_id.eq.${user.id},invitee_email.eq.${user.email}`)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      setInvitations(data as ReceivedInvitation[] || []);
    } catch (error) {
      console.error('Erro ao buscar convites recebidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    setProcessingIds(prev => new Set(prev).add(invitationId));

    try {
      const { data, error } = await supabase.rpc(
        action === 'accept' ? 'accept_invitation' : 'decline_invitation',
        { invitation_id: invitationId }
      );

      if (error) throw error;

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
  }, [user]);

  if (loading || invitations.length === 0) return null;

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
                    Convite de {invitation.profiles.name || invitation.profiles.email}
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
