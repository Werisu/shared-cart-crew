
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingItem } from './ShoppingListManager';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: ShoppingItem;
  onUpdate: (updates: Partial<ShoppingItem>) => void;
  onDelete: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onUpdate,
  onDelete
}) => {
  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      item.completed && "bg-gray-50 opacity-75"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={item.completed}
            onCheckedChange={(checked) => onUpdate({ completed: checked as boolean })}
            className="mt-0.5"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-medium",
              item.completed ? "line-through text-gray-500" : "text-gray-900"
            )}>
              {item.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {item.category}
              </span>
              <span className="text-xs text-gray-500">
                Qtd: {item.quantity}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-gray-400 hover:text-red-500 p-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
