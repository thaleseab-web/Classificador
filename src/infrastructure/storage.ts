import { get, set, del } from 'idb-keyval';
import { Transaction, Taxonomy } from '../domain/types';

const TRANSACTIONS_KEY = 'transactions';
const TAXONOMY_KEY = 'taxonomy';
const PENDING_SYNC_KEY = 'pending_sync';

export const saveLocalData = async (transactions: Transaction[], taxonomy: Taxonomy) => {
  await set(TRANSACTIONS_KEY, transactions);
  await set(TAXONOMY_KEY, taxonomy);
};

export const getLocalData = async (): Promise<{ transactions: Transaction[], taxonomy: Taxonomy } | null> => {
  const transactions = await get<Transaction[]>(TRANSACTIONS_KEY);
  const taxonomy = await get<Taxonomy>(TAXONOMY_KEY);
  if (!transactions || !taxonomy) return null;
  return { transactions, taxonomy };
};

export const addToSyncQueue = async (transaction: Transaction) => {
  const queue = (await get<Transaction[]>(PENDING_SYNC_KEY)) || [];
  // Update if exists, else add
  const index = queue.findIndex(t => t.id === transaction.id);
  if (index >= 0) {
    queue[index] = transaction;
  } else {
    queue.push(transaction);
  }
  await set(PENDING_SYNC_KEY, queue);
};

export const getSyncQueue = async (): Promise<Transaction[]> => {
  return (await get<Transaction[]>(PENDING_SYNC_KEY)) || [];
};

export const clearSyncQueue = async () => {
  await del(PENDING_SYNC_KEY);
};
