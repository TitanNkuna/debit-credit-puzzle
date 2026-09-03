export type Side = 'debit' | 'credit';
export type Category = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'other';

export interface SortItem {
  id: string;
  desc: string;
  side: Side;
  amount?: number | null;
  cat: Category;
  level: number;
  author?: string;
  createdAt?: string;
}

export interface AccountEntry {
  account: string;
  amount: number;
}

export interface JournalEntry {
  description: string;
  debits: AccountEntry[];
  credits: AccountEntry[];
}

export interface BalanceSheetChallenge {
  id: string;
  title: string;
  statement: string;
  level: number;
  author: string;
  createdAt: string;
  correctEntries: JournalEntry[];
  startingBalances?: {
    assets: Record<string, number>;
    liabilities: Record<string, number>;
    equity: Record<string, number>;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  level: number;
}

export interface CommunityData {
  items: SortItem[];
  sheets: BalanceSheetChallenge[];
}
