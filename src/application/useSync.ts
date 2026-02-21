import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { fetchInitialData, syncTransactions } from '../infrastructure/api';
import { saveLocalData, getLocalData, addToSyncQueue, getSyncQueue, clearSyncQueue } from '../infrastructure/storage';
import { Transaction } from '../domain/types';

export const useSync = () => {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['initialData'],
    queryFn: async () => {
      if (isOnline) {
        try {
          const remoteData = await fetchInitialData();
          await saveLocalData(remoteData.transactions, remoteData.taxonomy);
          return remoteData;
        } catch (err) {
          console.warn('Network failed, falling back to local data', err);
        }
      }
      const localData = await getLocalData();
      if (!localData) throw new Error('No data available offline');
      return localData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const checkConnection = async () => {
    try {
      await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
      setIsOnline(true);
      queryClient.invalidateQueries({ queryKey: ['initialData'] });
    } catch (e) {
      setIsOnline(false);
    }
  };

  const syncMutation = useMutation({
    mutationFn: async (transactionsToSync: Transaction[]) => {
      // 1. Update local storage immediately for persistence
      const localData = await getLocalData();
      if (localData) {
        const updatedTransactions = localData.transactions.map(t => {
          const update = transactionsToSync.find(u => u.id === t.id);
          return update ? { ...t, ...update } : t;
        });
        await saveLocalData(updatedTransactions, localData.taxonomy);
      }

      if (!isOnline) {
        for (const t of transactionsToSync) {
          await addToSyncQueue(t);
        }
        return false;
      }
      
      const success = await syncTransactions(transactionsToSync);
      return success;
    },
    onMutate: async (transactionsToSync) => {
      // 2. Optimistic update of the query cache
      await queryClient.cancelQueries({ queryKey: ['initialData'] });
      const previousData = queryClient.getQueryData(['initialData']);
      
      queryClient.setQueryData(['initialData'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          transactions: old.transactions.map((t: Transaction) => {
            const update = transactionsToSync.find(u => u.id === t.id);
            return update ? { ...t, ...update } : t;
          })
        };
      });

      return { previousData };
    },
    onError: (_err, _newTransactions, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['initialData'], context.previousData);
      }
    },
    onSettled: () => {
      // We don't necessarily want to invalidate immediately if we're offline
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ['initialData'] });
      }
    },
    onSuccess: async (synced) => {
      if (synced) {
        await clearSyncQueue();
      }
    },
  });

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      const drainQueue = async () => {
        const queue = await getSyncQueue();
        if (queue.length > 0) {
          setIsSyncing(true);
          try {
            await syncTransactions(queue);
            await clearSyncQueue();
            queryClient.invalidateQueries({ queryKey: ['initialData'] });
          } finally {
            setIsSyncing(false);
          }
        }
      };
      drainQueue();
    }
  }, [isOnline, queryClient]);

  return {
    transactions: data?.transactions || [],
    taxonomy: data?.taxonomy || [],
    isLoading,
    error,
    isOnline,
    isSyncing,
    sync: syncMutation.mutate,
    checkConnection,
  };
};
