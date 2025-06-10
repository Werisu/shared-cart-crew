
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingList, ShoppingItem } from './ShoppingListManager';
import { ArrowLeft, Plus, ListCheck } from 'lucide-react';
import { ItemCard } from './ItemCard';
import { AddItemModal } from './AddItemModal';

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

  const addItem = (name: string, category: string, quantity: number) => {
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name,
      category,
      quantity,
      completed: false
    };
    
    const updatedList = {
      ...list,
      items: [...list.items, newItem]
    };
    onUpdate(updatedList);
  };

  const updateItem = (itemId: string, updates: Partial<ShoppingItem>) => {
    const updatedList = {
      ...list,
      items: list.items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    };
    onUpdate(updatedList);
  };

  const deleteItem = (itemId: string) => {
    const updatedList = {
      ...list,
      items: list.items.filter(item => item.id !== itemId)
    };
    onUpdate(updatedList);
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
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

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
    </div>
  );
};
