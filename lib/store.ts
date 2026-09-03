import { SortItem, BalanceSheetChallenge, CommunityData } from './types';

// In-memory store (resets on server restart / redeploy).
// For production shared persistence, connect Vercel KV, Postgres, or Supabase.
const initialSeed: CommunityData = {
  items: [
    {
      id: 'seed-1',
      desc: 'Increase in Cash from customer payment',
      side: 'debit',
      amount: 750,
      cat: 'asset',
      level: 1,
      author: 'System',
      createdAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'seed-2',
      desc: 'Revenue from consulting services',
      side: 'credit',
      amount: 1200,
      cat: 'revenue',
      level: 1,
      author: 'System',
      createdAt: '2026-09-01T00:00:00Z',
    },
  ],
  sheets: [
    {
      id: 'sheet-1',
      title: 'Starter Business Setup',
      statement: 'Owner invests $10,000 cash and the business buys $2,500 of inventory with cash. Then purchases $4,000 equipment on account.',
      level: 1,
      author: 'System',
      createdAt: '2026-09-01T00:00:00Z',
      correctEntries: [
        {
          description: 'Owner investment',
          debits: [{ account: 'Cash', amount: 10000 }],
          credits: [{ account: "Owner's Capital", amount: 10000 }],
        },
        {
          description: 'Buy inventory with cash',
          debits: [{ account: 'Inventory', amount: 2500 }],
          credits: [{ account: 'Cash', amount: 2500 }],
        },
        {
          description: 'Buy equipment on account',
          debits: [{ account: 'Equipment', amount: 4000 }],
          credits: [{ account: 'Accounts Payable', amount: 4000 }],
        },
      ],
    },
  ],
};

let store: CommunityData = {
  items: [...initialSeed.items],
  sheets: [...initialSeed.sheets],
};

export function getCommunity(): CommunityData {
  return store;
}

export function addItem(item: SortItem): SortItem {
  store.items.push(item);
  return item;
}

export function addSheet(sheet: BalanceSheetChallenge): BalanceSheetChallenge {
  store.sheets.push(sheet);
  return sheet;
}

export function getItemById(id: string): SortItem | undefined {
  return store.items.find((i) => i.id === id);
}

export function getSheetById(id: string): BalanceSheetChallenge | undefined {
  return store.sheets.find((s) => s.id === s.id);
}
