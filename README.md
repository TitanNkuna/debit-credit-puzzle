# Debit ↔ Credit Puzzle Game

An interactive educational game that teaches accounting students the difference between **debits** and **credits**, double-entry bookkeeping, and how to keep a balance sheet balanced.

## Features

- **Learn Rules** – Clear explanations + DEA-LER memory trick
- **Sort Puzzle** – Classify items as Debit or Credit (drag/click). Progressive difficulty
- **Interactive Balance Sheet** – Students read a transaction statement and **build the journal entries themselves** (choose accounts + amounts). The equation updates live
- **Quiz Mode** – Multiple-choice questions with explanations
- **Classroom Mode** – Generate a class code and share with students
- **Community / Shared Content**
  - Anyone can add new Debit/Credit items → immediately available to all players
  - Anyone can publish a Balance Sheet challenge **with the answer key**
  - Other players only receive the **statement** and must solve the empty sheet themselves

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- React
- Simple in-memory API store (easy to swap for Vercel KV / Postgres / Supabase)

## Getting Started (Local)

```bash
cd debit-credit-game
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel + GitHub

1. Create a new GitHub repository
2. Push this folder to the repo
3. In Vercel → New Project → Import the GitHub repo
4. Deploy (zero config needed)

Every push to `main` will automatically redeploy.

### Making community data persistent for everyone

The current `/api/community` uses an in-memory store (data resets on redeploy).  
For real shared persistence across all users:

**Option A – Vercel KV (Redis)**  
```bash
npm install @vercel/kv
```
Then update `lib/store.ts` to use `kv.get` / `kv.set`.

**Option B – Vercel Postgres**  
Connect a Postgres database in the Vercel dashboard and store items/sheets in tables.

**Option C – Supabase (free tier)**  
Create a project, two tables (`items`, `sheets`), and replace the store functions.

## Project Structure

```
app/
  page.tsx          # Main interactive UI (all modes)
  layout.tsx
  globals.css
  api/community/    # GET/POST shared items & sheets
lib/
  types.ts
  data.ts           # Seed questions, accounts, default sheets
  store.ts          # In-memory community store
data/
  community.json    # Seed data
```

## How Teachers Use It

1. Open **Add & Share**
2. Create a Balance Sheet challenge → fill the correct journal entries (answer key)
3. Publish
4. Students open **Balance Sheet**, receive only the statement, and must construct the correct debits & credits
5. Use **Classroom** tab to generate a code and keep everyone on the same page

## License

MIT – free for education use.
