
import React from 'react';
import { ShoppingCart } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lista de Compras</h1>
            <p className="text-gray-600">Organize suas compras de forma inteligente</p>
          </div>
        </div>
      </div>
    </header>
  );
};
