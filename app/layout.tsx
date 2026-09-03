import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Debit ↔ Credit Puzzle | Accounting Game',
  description: 'Interactive game that teaches debits, credits, balance sheets and double-entry bookkeeping. Classroom ready with shared community content.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
