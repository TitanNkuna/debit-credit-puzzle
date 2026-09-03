import { SortItem, BalanceSheetChallenge, CommunityData } from './types';
import communitySeed from '../data/community.json';

// In-memory store (resets on server restart / redeploy).
// For production shared persistence across all users, connect Vercel KV, Postgres, or Supabase.
let store: CommunityData = {
  items: [...(communitySeed.items as SortItem[])],
  sheets: [...(communitySeed.sheets as BalanceSheetChallenge[])],
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
  return store.sheets.find((s) => s.id === id);
}
