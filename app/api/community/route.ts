import { NextRequest, NextResponse } from 'next/server';
import { getCommunity, addItem, addSheet } from '@/lib/store';
import { SortItem, BalanceSheetChallenge } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const data = getCommunity();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load community data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === 'item') {
      const { desc, side, amount, cat, author, level } = body;
      if (!desc || !side || !['debit', 'credit'].includes(side)) {
        return NextResponse.json({ error: 'desc and valid side (debit/credit) are required' }, { status: 400 });
      }
      const item: SortItem = {
        id: uuidv4(),
        desc: String(desc).trim(),
        side,
        amount: amount ? Number(amount) : null,
        cat: cat || 'other',
        level: level || 1,
        author: author || 'Anonymous',
        createdAt: new Date().toISOString(),
      };
      addItem(item);
      return NextResponse.json({ success: true, item });
    }

    if (type === 'sheet') {
      const { title, statement, level, author, correctEntries } = body;
      if (!title || !statement || !Array.isArray(correctEntries) || correctEntries.length === 0) {
        return NextResponse.json(
          { error: 'title, statement, and at least one correctEntry (with debits & credits) are required' },
          { status: 400 }
        );
      }
      for (const entry of correctEntries) {
        const debitTotal = (entry.debits || []).reduce((s: number, d: any) => s + Number(d.amount || 0), 0);
        const creditTotal = (entry.credits || []).reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
        if (debitTotal !== creditTotal || debitTotal === 0) {
          return NextResponse.json(
            { error: `Entry "${entry.description || 'unnamed'}" does not balance (debits must equal credits and be > 0)` },
            { status: 400 }
          );
        }
      }
      const sheet: BalanceSheetChallenge = {
        id: uuidv4(),
        title: String(title).trim(),
        statement: String(statement).trim(),
        level: level || 1,
        author: author || 'Anonymous',
        createdAt: new Date().toISOString(),
        correctEntries,
      };
      addSheet(sheet);
      return NextResponse.json({ success: true, sheet });
    }

    return NextResponse.json({ error: 'Invalid type. Use "item" or "sheet"' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
