
import React, { useState } from 'react';
import { ShoppingListManager } from '@/components/ShoppingListManager';
import { Header } from '@/components/Header';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <ShoppingListManager />
      </main>
    </div>
  );
};

export default Index;
