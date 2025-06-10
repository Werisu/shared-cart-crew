
import React, { useState } from 'react';
import { ShoppingListCard } from './ShoppingListCard';
import { CreateListModal } from './CreateListModal';
import { ListDetail } from './ListDetail';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  quantity: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  description: string;
  items: ShoppingItem[];
  createdAt: Date;
  color: string;
}

export const ShoppingListManager = () => {
  const [lists, setLists] = useState<ShoppingList[]>([
    {
      id: '1',
      name: 'Supermercado da Semana',
      description: 'Compras básicas para a casa',
      items: [
        { id: '1', name: 'Leite', category: 'Laticínios', completed: false, quantity: 2 },
        { id: '2', name: 'Pão', category: 'Padaria', completed: true, quantity: 1 },
        { id: '3', name: 'Maçãs', category: 'Frutas', completed: false, quantity: 6 },
      ],
      createdAt: new Date(),
      color: 'blue'
    },
    {
      id: '2',
      name: 'Churrasco do Final de Semana',
      description: 'Ingredientes para o churrasco',
      items: [
        { id: '4', name: 'Picanha', category: 'Carnes', completed: false, quantity: 1 },
        { id: '5', name: 'Carvão', category: 'Outros', completed: false, quantity: 1 },
      ],
      createdAt: new Date(),
      color: 'green'
    }
  ]);
  
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const createList = (name: string, description: string, color: string) => {
    const newList: ShoppingList = {
      id: Date.now().toString(),
      name,
      description,
      items: [],
      createdAt: new Date(),
      color
    };
    setLists([...lists, newList]);
  };

  const deleteList = (listId: string) => {
    setLists(lists.filter(list => list.id !== listId));
    if (selectedList === listId) {
      setSelectedList(null);
    }
  };

  const updateList = (updatedList: ShoppingList) => {
    setLists(lists.map(list => list.id === updatedList.id ? updatedList : list));
  };

  const selectedListData = lists.find(list => list.id === selectedList);

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Suas Listas</h2>
          <p className="text-gray-600 mt-1">Gerencie suas listas de compras</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Lista
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map((list) => (
          <ShoppingListCard
            key={list.id}
            list={list}
            onSelect={() => setSelectedList(list.id)}
            onDelete={() => deleteList(list.id)}
          />
        ))}
      </div>

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createList}
      />
    </div>
  );
};
