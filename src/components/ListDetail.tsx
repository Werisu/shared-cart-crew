
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingList, ShoppingItem } from './ShoppingListManager';
import { ArrowLeft, Plus, ListCheck, UserPlus } from 'lucide-react';
import { ItemCard } from './ItemCard';
import { AddItemModal } from './AddItemModal';
import { InviteCollaboratorModal } from './InviteCollaboratorModal';
import { PendingInvitations } from './PendingInvitations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ListDetailProps {
  list: ShoppingList;
  onBack: () => void;
  onUpdate: (list: ShoppingList) => void;
}

export const ListDetail: React.FC<ListDetailProps> = ({
  list,
  onBack,
  onUpdate
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const isOwner = list.created_by === user?.id;

  const addItem = async (name: string, category: string, quantity: number) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .insert({
          list_id: list.id,
          name,
          category,
          quantity
        })
        .select()
        .single();

      if (error) throw error;

      const updatedList = {
        ...list,
        items: [...list.items, data]
      };
      onUpdate(updatedList);

      toast({
        title: "Item adicionado",
        description: `${name} foi adicionado à lista`
      });
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item",
        variant: "destructive"
      });
    }
  };

  const updateItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({
          ...updates,
          completed_by: updates.completed ? user?.id : null,
          completed_at: updates.completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      const updatedList = {
        ...list,
        items: list.items.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      };
      onUpdate(updatedList);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item",
        variant: "destructive"
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      const updatedList = {
        ...list,
        items: list.items.filter(item => item.id !== itemId)
      };
      onUpdate(updatedList);

      toast({
        title: "Item removido",
        description: "O item foi removido da lista"
      });
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item",
        variant: "destructive"
      });
    }
  };

  const completedItems = list.items.filter(item => item.completed);
  const pendingItems = list.items.filter(item => !item.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{list.name}</h1>
          <p className="text-gray-600">{list.description}</p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Button 
              variant="outline"
              onClick={() => setIsInviteModalOpen(true)}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar
            </Button>
          )}
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {/* Convites pendentes (só para proprietários) */}
      {isOwner && (
        <PendingInvitations 
          listId={list.id} 
          onInvitationUpdate={() => {/* refresh if needed */}} 
        />
      )}

      {/* Progress */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center gap-3 mb-3">
          <ListCheck className="h-5 w-5 text-blue-600" />
          <span className="font-medium">
            {completedItems.length} de {list.items.length} itens concluídos
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
            style={{ 
              width: `${list.items.length > 0 ? (completedItems.length / list.items.length) * 100 : 0}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-6">
        {pendingItems.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Pendentes ({pendingItems.length})
            </h2>
            <div className="space-y-2">
              {pendingItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onUpdate={(updates) => updateItem(item.id, updates)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {completedItems.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-500 mb-3">
              Concluídos ({completedItems.length})
            </h2>
            <div className="space-y-2">
              {completedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onUpdate={(updates) => updateItem(item.id, updates)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {list.items.length === 0 && (
          <div className="text-center py-12">
            <ListCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Lista vazia</h3>
            <p className="text-gray-500">Adicione alguns itens para começar</p>
          </div>
        )}
      </div>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addItem}
      />

      <InviteCollaboratorModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        listId={list.id}
        listName={list.name}
      />
    </div>
  );
};
