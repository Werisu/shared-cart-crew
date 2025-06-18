
import React, { useState, useEffect } from 'react';
import { ShoppingListCard } from './ShoppingListCard';
import { CreateListModal } from './CreateListModal';
import { ListDetail } from './ListDetail';
import { InviteCollaboratorModal } from './InviteCollaboratorModal';
import { ReceivedInvitations } from './ReceivedInvitations';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  quantity: number;
  completed_by?: string | null;
  completed_at?: string | null;
  list_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  description: string;
  items: ShoppingItem[];
  created_at: string;
  color: string;
  created_by: string;
  updated_at: string;
}

export const ShoppingListManager = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedListForInvite, setSelectedListForInvite] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLists = async () => {
    if (!user) return;

    try {
      const { data: listsData, error: listsError } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;

      // Buscar itens para cada lista
      const listsWithItems = await Promise.all(
        (listsData || []).map(async (list) => {
          const { data: items, error: itemsError } = await supabase
            .from('shopping_items')
            .select('*')
            .eq('list_id', list.id)
            .order('created_at', { ascending: true });

          if (itemsError) {
            console.error('Erro ao buscar itens:', itemsError);
            return { ...list, items: [] };
          }

          return {
            ...list,
            items: items || []
          };
        })
      );

      setLists(listsWithItems);
    } catch (error) {
      console.error('Erro ao carregar listas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as listas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [user]);

  const createList = async (name: string, description: string, color: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          name,
          description,
          color,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      const newList = { ...data, items: [] };
      setLists([newList, ...lists]);
      
      toast({
        title: "Lista criada!",
        description: `A lista "${name}" foi criada com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a lista",
        variant: "destructive"
      });
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      setLists(lists.filter(list => list.id !== listId));
      if (selectedList === listId) {
        setSelectedList(null);
      }

      toast({
        title: "Lista excluída",
        description: "A lista foi removida com sucesso."
      });
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a lista",
        variant: "destructive"
      });
    }
  };

  const updateList = (updatedList: ShoppingList) => {
    setLists(lists.map(list => list.id === updatedList.id ? updatedList : list));
  };

  const handleInviteClick = (list: ShoppingList) => {
    setSelectedListForInvite(list);
    setIsInviteModalOpen(true);
  };

  const handleInviteModalClose = () => {
    setIsInviteModalOpen(false);
    setSelectedListForInvite(null);
  };

  const selectedListData = lists.find(list => list.id === selectedList);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando listas...</p>
        </div>
      </div>
    );
  }

  if (selectedList && selectedListData) {
    return (
      <ListDetail 
        list={selectedListData}
        onBack={() => setSelectedList(null)}
        onUpdate={updateList}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Seção de convites recebidos */}
      <ReceivedInvitations />
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Suas Listas</h2>
          <p className="text-gray-600 mt-1">Gerencie suas listas de compras compartilhadas</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Lista
        </Button>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Plus className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma lista ainda</h3>
          <p className="text-gray-600 mb-6">Crie sua primeira lista de compras para começar</p>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar primeira lista
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => {
            const isOwner = list.created_by === user?.id;
            return (
              <ShoppingListCard
                key={list.id}
                list={list}
                onSelect={() => setSelectedList(list.id)}
                onDelete={() => deleteList(list.id)}
                onInvite={() => handleInviteClick(list)}
                isOwner={isOwner}
              />
            );
          })}
        </div>
      )}

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createList}
      />

      {selectedListForInvite && (
        <InviteCollaboratorModal
          isOpen={isInviteModalOpen}
          onClose={handleInviteModalClose}
          listId={selectedListForInvite.id}
          listName={selectedListForInvite.name}
        />
      )}
    </div>
  );
};
