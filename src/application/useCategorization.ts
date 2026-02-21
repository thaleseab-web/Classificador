import { useState, useCallback } from 'react';
import { Transaction, Category } from '../domain/types';
import { useSync } from './useSync';
import confetti from 'canvas-confetti';

export const useCategorization = () => {
  const { transactions, sync } = useSync();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categorizedCount, setCategorizedCount] = useState(0);

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const currentTransaction = pendingTransactions[currentIndex];

  const categorize = useCallback((category: Category, fullPath?: string) => {
    if (!currentTransaction) return;

    const updatedTransaction: Transaction = {
      ...currentTransaction,
      categoryId: category.id,
      categoryName: fullPath || category.name,
      status: 'categorized',
    };

    // Optimistic update logic would go here if we managed local state more granularly
    // For now, we rely on the sync hook to handle persistence
    sync([updatedTransaction]);

    setCategorizedCount(prev => {
      const newCount = prev + 1;
      if (newCount % 10 === 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF4500'],
        });
      }
      return newCount;
    });

    // Move to next: 
    // We don't increment currentIndex here because the item we just categorized 
    // will be removed from the pendingTransactions list (due to status change),
    // and the next item will naturally "slide" into the current currentIndex.
    // We only need to ensure we don't stay out of bounds if we categorized the last item.
    if (currentIndex >= pendingTransactions.length - 1) {
      setCurrentIndex(0);
    }
  }, [currentTransaction, currentIndex, pendingTransactions.length, sync]);

  const skip = useCallback(() => {
    if (currentIndex < pendingTransactions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, pendingTransactions.length]);

  return {
    currentTransaction,
    categorize,
    skip,
    remaining: pendingTransactions.length,
    totalCategorized: categorizedCount,
  };
};
