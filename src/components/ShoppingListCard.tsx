
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingList } from './ShoppingListManager';
import { ListCheck, Share, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShoppingListCardProps {
  list: ShoppingList;
  onSelect: () => void;
  onDelete: () => void;
}

export const ShoppingListCard: React.FC<ShoppingListCardProps> = ({
  list,
  onSelect,
  onDelete
}) => {
  const completedItems = list.items.filter(item => item.completed).length;
  const totalItems = list.items.length;
  const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const colorClasses = {
    blue: 'border-l-blue-500 bg-blue-50',
    green: 'border-l-green-500 bg-green-50',
    purple: 'border-l-purple-500 bg-purple-50',
    orange: 'border-l-orange-500 bg-orange-50',
  };

  return (
    <Card className={cn(
      "cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-l-4",
      colorClasses[list.color as keyof typeof colorClasses] || colorClasses.blue
    )}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1" onClick={onSelect}>
            <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
              {list.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {list.description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-gray-400 hover:text-red-500 p-1"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3" onClick={onSelect}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListCheck className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {completedItems} de {totalItems} itens
              </span>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-500 p-1">
              <Share className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
