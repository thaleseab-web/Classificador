export interface Transaction {
  id: string; // The establishment name is the ID
  originalName: string;
  amount?: number;
  date?: string;
  categoryId?: string;
  categoryName?: string;
  status: 'pending' | 'categorized' | 'synced';
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
  children?: Category[];
}

export type Taxonomy = Category[];

export interface SyncStatus {
  lastSync: number;
  pendingCount: number;
  isOnline: boolean;
}

export const isValidTransaction = (t: Transaction): boolean => {
  return !!t.id && t.id.length > 0;
};
