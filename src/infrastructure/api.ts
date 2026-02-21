import { Transaction, Taxonomy } from '../domain/types';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwP2DaHgUVYoj_RyVa3u1Sd2InZ3LmPiaJR1LPxbp1Pdxv_6e8T3_0b2u7So5dIuEbR/exec';

interface GasCategory {
  tipo: string;
  icone?: string;
  subcategorias: {
    nome: string;
    icone?: string;
    itens: {
      nome: string;
      icone?: string;
    }[];
  }[];
}

interface GasTransaction {
  id?: string | number;
  estabelecimento?: string;
  nome?: string;
  data?: string;
  valor?: number;
  amount?: number;
  date?: string;
  [key: string]: any;
}

const mapTaxonomy = (gasCategories: GasCategory[]): Taxonomy => {
  return gasCategories.map((cat) => ({
    id: cat.tipo,
    name: cat.tipo,
    icon: cat.icone,
    children: cat.subcategorias.map((sub) => ({
      id: `${cat.tipo}-${sub.nome}`,
      name: sub.nome,
      parentId: cat.tipo,
      icon: sub.icone,
      children: sub.itens.map((item) => ({
        id: `${cat.tipo}-${sub.nome}-${item.nome}`,
        name: item.nome,
        parentId: `${cat.tipo}-${sub.nome}`,
        icon: item.icone,
      })),
    })),
  }));
};

const mapTransactions = (gasTransactions: GasTransaction[]): Transaction[] => {
  return gasTransactions.map((t) => {
    const name = t.estabelecimento || t.nome || 'Desconhecido';
    // Prefer the ID from the sheet (converted to string), fallback to name if ID is missing
    const id = t.id != null ? String(t.id) : name;
    
    return {
      id: id,
      originalName: name,
      amount: t.valor || t.amount || 0,
      date: t.data ? new Date(t.data).toLocaleDateString('pt-BR') : undefined,
      status: 'pending',
    };
  });
};

export const fetchInitialData = async (): Promise<{ transactions: Transaction[], taxonomy: Taxonomy }> => {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getData`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    console.log('Fetched data from GAS:', data); // Debug log
    
    // Check if the response has the expected structure from GAS
    if (data.estabelecimentos && data.categorias) {
      const transactions = mapTransactions(data.estabelecimentos);
      const taxonomy = mapTaxonomy(data.categorias);
      console.log('Mapped transactions:', transactions.length);
      console.log('Mapped taxonomy:', taxonomy.length);
      return {
        transactions,
        taxonomy,
      };
    }
    
    // Fallback if the structure matches the domain types directly
    return data;
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
    throw error;
  }
};

export const syncTransactions = async (transactions: Transaction[]): Promise<boolean> => {
  try {
    console.log('Syncing transactions to GAS:', transactions);
    
    // We use text/plain to avoid CORS preflight (OPTIONS request)
    // Google Apps Script doPost handles this in e.postData.contents
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      body: JSON.stringify({ 
        action: 'sync', 
        transactions: transactions.map(t => ({
          id: t.id,
          estabelecimento: t.originalName,
          categoria: t.categoryName,
          categoriaId: t.categoryId
        }))
      }),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });
    
    // With no-cors, we can't check response.ok (it's always false/opaque)
    // If it didn't throw, we assume the browser sent the request
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    return false;
  }
};