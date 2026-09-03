'use client';

import { useState, useEffect, useCallback } from 'react';
import { BASE_ITEMS, QUIZ_QUESTIONS, DEFAULT_SHEETS, COMMON_ACCOUNTS } from '@/lib/data';
import { SortItem, BalanceSheetChallenge, JournalEntry, AccountEntry, QuizQuestion } from '@/lib/types';

type Tab = 'learn' | 'sort' | 'balance' | 'quiz' | 'classroom' | 'community';

export default function Home() {
  const [tab, setTab] = useState<Tab>('learn');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);

  // Sort state
  const [sortItems, setSortItems] = useState<(SortItem & { placed: 'debit' | 'credit' | null })[]>([]);
  const [communityItems, setCommunityItems] = useState<SortItem[]>([]);
  const [communitySheets, setCommunitySheets] = useState<BalanceSheetChallenge[]>([]);

  // Balance interactive state
  const [currentSheet, setCurrentSheet] = useState<BalanceSheetChallenge | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [userEntries, setUserEntries] = useState<JournalEntry[]>([]);
  const [currentEntryDesc, setCurrentEntryDesc] = useState('');
  const [debitRows, setDebitRows] = useState<AccountEntry[]>([{ account: 'Cash', amount: 0 }]);
  const [creditRows, setCreditRows] = useState<AccountEntry[]>([{ account: "Owner's Capital", amount: 0 }]);
  const [bsBalances, setBsBalances] = useState({
    assets: {} as Record<string, number>,
    liabilities: {} as Record<string, number>,
    equity: {} as Record<string, number>,
  });

  // Quiz
  const [quizQ, setQuizQ] = useState<QuizQuestion | null>(null);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Classroom
  const [classCode, setClassCode] = useState('');
  const [joinedCode, setJoinedCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  // Community form
  const [newItem, setNewItem] = useState({ desc: '', side: 'debit' as 'debit' | 'credit', amount: '', cat: 'asset', author: '' });
  const [newSheet, setNewSheet] = useState({
    title: '',
    statement: '',
    level: 1,
    author: '',
    entries: [{ description: '', debits: [{ account: 'Cash', amount: 0 }], credits: [{ account: "Owner's Capital", amount: 0 }] }],
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  // Load community data
  useEffect(() => {
    fetch('/api/community')
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setCommunityItems(data.items);
        if (data.sheets) setCommunitySheets(data.sheets);
      })
      .catch(() => {});
  }, []);

  const allItems = [...BASE_ITEMS, ...communityItems];
  const allSheets = [...DEFAULT_SHEETS, ...communitySheets];

  // ---------- SORT ----------
  const startSort = () => {
    const available = allItems.filter((i) => (i.level || 1) <= level);
    const count = Math.min(5 + level, 9);
    const shuffled = [...available].sort(() => Math.random() - 0.5).slice(0, count);
    setSortItems(shuffled.map((i) => ({ ...i, placed: null })));
    setFeedback(null);
  };

  useEffect(() => {
    if (tab === 'sort' && sortItems.length === 0) startSort();
  }, [tab]);

  const placeItem = (id: string, side: 'debit' | 'credit' | null) => {
    setSortItems((prev) => prev.map((i) => (i.id === id ? { ...i, placed: side } : i)));
  };

  const checkSort = () => {
    let correct = 0;
    sortItems.forEach((item) => {
      if (item.placed === item.side) correct++;
    });
    if (correct === sortItems.length) {
      const points = correct * 10 + streak * 5;
      setScore((s) => s + points);
      setStreak((st) => st + 1);
      if (streak + 1 >= 3 && level < 5) setLevel((l) => l + 1);
      setFeedback({ type: 'success', msg: `Perfect! +${points} points.` });
    } else {
      setStreak(0);
      setFeedback({ type: 'error', msg: `${correct}/${sortItems.length} correct. Remember DEA-LER!` });
    }
  };

  // ---------- BALANCE SHEET ----------
  const loadSheet = (idx: number) => {
    const sheet = allSheets[idx % allSheets.length];
    setCurrentSheet(sheet);
    setSheetIndex(idx);
    setUserEntries([]);
    setCurrentEntryDesc('');
    setDebitRows([{ account: 'Cash', amount: 0 }]);
    setCreditRows([{ account: "Owner's Capital", amount: 0 }]);
    setBsBalances({ assets: {}, liabilities: {}, equity: {} });
    setFeedback(null);
  };

  useEffect(() => {
    if (tab === 'balance' && !currentSheet) loadSheet(0);
  }, [tab]);

  const applyUserEntry = () => {
    const debitTotal = debitRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const creditTotal = creditRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    if (debitTotal === 0 || debitTotal !== creditTotal) {
      setFeedback({ type: 'error', msg: 'Debits must equal Credits and be greater than zero.' });
      return;
    }
    const entry: JournalEntry = {
      description: currentEntryDesc || `Entry ${userEntries.length + 1}`,
      debits: debitRows.filter((r) => r.amount > 0),
      credits: creditRows.filter((r) => r.amount > 0),
    };
    const newBal = { ...bsBalances, assets: { ...bsBalances.assets }, liabilities: { ...bsBalances.liabilities }, equity: { ...bsBalances.equity } };
    entry.debits.forEach((d) => {
      if (COMMON_ACCOUNTS.assets.includes(d.account) || d.account.includes('Accum')) {
        newBal.assets[d.account] = (newBal.assets[d.account] || 0) + d.amount;
      } else if (COMMON_ACCOUNTS.liabilities.includes(d.account)) {
        newBal.liabilities[d.account] = (newBal.liabilities[d.account] || 0) - d.amount;
      } else {
        newBal.equity[d.account] = (newBal.equity[d.account] || 0) - d.amount;
      }
    });
    entry.credits.forEach((c) => {
      if (COMMON_ACCOUNTS.assets.includes(c.account) || c.account.includes('Accum')) {
        newBal.assets[c.account] = (newBal.assets[c.account] || 0) - c.amount;
      } else if (COMMON_ACCOUNTS.liabilities.includes(c.account)) {
        newBal.liabilities[c.account] = (newBal.liabilities[c.account] || 0) + c.amount;
      } else {
        newBal.equity[c.account] = (newBal.equity[c.account] || 0) + c.amount;
      }
    });
    setBsBalances(newBal);
    setUserEntries((prev) => [...prev, entry]);
    setCurrentEntryDesc('');
    setDebitRows([{ account: 'Cash', amount: 0 }]);
    setCreditRows([{ account: "Owner's Capital", amount: 0 }]);
    setFeedback({ type: 'info', msg: 'Entry recorded. Continue then Check.' });
  };

  const checkSheetAnswers = () => {
    if (!currentSheet) return;
    const totalA = Object.values(bsBalances.assets).reduce((a, b) => a + b, 0);
    const totalL = Object.values(bsBalances.liabilities).reduce((a, b) => a + b, 0);
    const totalE = Object.values(bsBalances.equity).reduce((a, b) => a + b, 0);
    if (totalA !== totalL + totalE) {
      setFeedback({ type: 'error', msg: `Equation not balanced. Assets $${totalA} ≠ L+E $${totalL + totalE}` });
      return;
    }
    setScore((s) => s + 40);
    setStreak((st) => st + 1);
    setFeedback({ type: 'success', msg: 'Well done! Balance sheet is correct. +40 points' });
  };

  const totalAssets = Object.values(bsBalances.assets).reduce((a, b) => a + b, 0);
  const totalLiab = Object.values(bsBalances.liabilities).reduce((a, b) => a + b, 0);
  const totalEquity = Object.values(bsBalances.equity).reduce((a, b) => a + b, 0);
  const isBalanced = totalAssets === totalLiab + totalEquity;

  // ---------- QUIZ ----------
  const startQuiz = () => {
    const available = QUIZ_QUESTIONS.filter((q) => q.level <= level + 1);
    const q = available[Math.floor(Math.random() * available.length)];
    setQuizQ(q);
    setQuizSelected(null);
    setQuizAnswered(false);
  };

  useEffect(() => {
    if (tab === 'quiz' && !quizQ) startQuiz();
  }, [tab]);

  const submitQuiz = () => {
    if (quizSelected === null || !quizQ) return;
    setQuizAnswered(true);
    if (quizSelected === quizQ.correctIndex) {
      setQuizScore((s) => s + 1);
      setScore((s) => s + 15);
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
    }
  };

  // ---------- COMMUNITY ----------
  const submitItem = async () => {
    if (!newItem.desc.trim()) {
      setFeedback({ type: 'error', msg: 'Description required' });
      return;
    }
    const res = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'item',
        desc: newItem.desc,
        side: newItem.side,
        amount: newItem.amount || null,
        cat: newItem.cat,
        author: newItem.author || 'Anonymous',
        level,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setCommunityItems((prev) => [...prev, data.item]);
      setNewItem({ desc: '', side: 'debit', amount: '', cat: 'asset', author: newItem.author });
      setFeedback({ type: 'success', msg: 'Item added to community!' });
    } else {
      setFeedback({ type: 'error', msg: data.error || 'Failed' });
    }
  };

  const submitSheet = async () => {
    if (!newSheet.title || !newSheet.statement || newSheet.entries.length === 0) {
      setFeedback({ type: 'error', msg: 'Title, statement and at least one entry required' });
      return;
    }
    for (const e of newSheet.entries) {
      const d = e.debits.reduce((s, x) => s + Number(x.amount || 0), 0);
      const c = e.credits.reduce((s, x) => s + Number(x.amount || 0), 0);
      if (d !== c || d === 0) {
        setFeedback({ type: 'error', msg: `Entry "${e.description}" does not balance` });
        return;
      }
    }
    const res = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sheet',
        title: newSheet.title,
        statement: newSheet.statement,
        level: newSheet.level,
        author: newSheet.author || 'Anonymous',
        correctEntries: newSheet.entries,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setCommunitySheets((prev) => [...prev, data.sheet]);
      setNewSheet({
        title: '',
        statement: '',
        level: 1,
        author: newSheet.author,
        entries: [{ description: '', debits: [{ account: 'Cash', amount: 0 }], credits: [{ account: "Owner's Capital", amount: 0 }] }],
      });
      setFeedback({ type: 'success', msg: 'Balance sheet challenge published!' });
    } else {
      setFeedback({ type: 'error', msg: data.error || 'Failed' });
    }
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setClassCode(code);
  };

  const joinClass = () => {
    if (!joinedCode.trim()) return;
    setClassCode(joinedCode.toUpperCase());
    setFeedback({ type: 'info', msg: `Joined class ${joinedCode.toUpperCase()}` });
  };

  const allAccounts = [...COMMON_ACCOUNTS.assets, ...COMMON_ACCOUNTS.liabilities, ...COMMON_ACCOUNTS.equity];

  return (
    <div className="container">
      <header>
        <div className="logo">📊 Debit ↔ Credit Puzzle</div>
        <div className="stats">
          <div className="stat">Level <strong>{level}</strong></div>
          <div className="stat">Score <strong>{score}</strong></div>
          <div className="stat">Streak <strong>{streak}</strong></div>
          <div className={`balance-indicator ${isBalanced ? 'balanced' : 'unbalanced'}`}>
            {isBalanced ? '✓ Balanced' : 'Not Balanced'}
          </div>
        </div>
      </header>

      <nav>
        {(['learn', 'sort', 'balance', 'quiz', 'classroom', 'community'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`btn ${tab === t ? 'active' : ''} ${t === 'sort' ? 'btn-debit' : t === 'balance' ? 'btn-credit' : t === 'quiz' ? 'btn-primary' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'learn' && 'Learn'}
            {t === 'sort' && 'Sort Puzzle'}
            {t === 'balance' && 'Balance Sheet'}
            {t === 'quiz' && 'Quiz'}
            {t === 'classroom' && 'Classroom'}
            {t === 'community' && 'Add & Share'}
          </button>
        ))}
      </nav>

      {feedback && (
        <div className={`feedback ${feedback.type}`} style={{ marginBottom: 12 }}>
          {feedback.msg}
          <button className="btn btn-ghost" style={{ marginLeft: 8, padding: '2px 8px' }} onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {tab === 'learn' && (
        <section className="panel">
          <h2>Debits & Credits — Golden Rules</h2>
          <p style={{ color: 'var(--muted)', margin: '8px 0 12px' }}>
            Every transaction has equal total debits and credits. Debit = left side. Credit = right side.
          </p>
          <div className="rules-grid">
            <div className="rule-card">
              <h3 style={{ color: 'var(--debit)' }}>Debit increases…</h3>
              <ul>
                <li><strong>Assets</strong> (Cash, Inventory, Equipment…)</li>
                <li><strong>Expenses</strong> (Rent, Salaries…)</li>
                <li><strong>Drawings / Dividends</strong></li>
              </ul>
            </div>
            <div className="rule-card">
              <h3 style={{ color: 'var(--credit)' }}>Credit increases…</h3>
              <ul>
                <li><strong>Liabilities</strong> (Payables, Loans…)</li>
                <li><strong>Equity</strong> (Capital, Retained Earnings)</li>
                <li><strong>Revenue</strong> (Sales, Service Income)</li>
              </ul>
            </div>
            <div className="rule-card">
              <h3>DEA-LER Trick</h3>
              <ul>
                <li>Debits → Expenses & Assets</li>
                <li>Credits → Liabilities, Equity, Revenue</li>
              </ul>
            </div>
            <div className="rule-card">
              <h3>Always Balance</h3>
              <ul>
                <li>Total Debits = Total Credits</li>
                <li>Assets = Liabilities + Equity</li>
              </ul>
            </div>
          </div>
          <div className="tip">
            <strong>Pro tip:</strong> Cash in → Debit Cash. Cash out → Credit Cash. Then decide the other side.
          </div>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button className="btn btn-primary" onClick={() => { setTab('sort'); startSort(); }}>
              Start Sorting Puzzle →
            </button>
          </div>
        </section>
      )}

      {tab === 'sort' && (
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <h2>Sort into Debit or Credit <span className="level-badge">Level {level}</span></h2>
            <div>
              <button className="btn btn-ghost" onClick={checkSort}>Check Answers</button>
              <button className="btn btn-primary" onClick={startSort} style={{ marginLeft: 6 }}>New Round</button>
            </div>
          </div>
          <p style={{ color: 'var(--muted)', marginBottom: 12, fontSize: '0.9rem' }}>
            Click Debit or Credit for each item.
          </p>
          <div className="game-layout">
            <div className="column debit">
              <h3>DEBIT (Left)</h3>
              <div className="drop-zone">
                {sortItems.filter((i) => i.placed === 'debit').map((item) => (
                  <div key={item.id} className={`item ${item.placed === item.side ? 'correct' : item.placed ? 'wrong' : ''}`} onClick={() => placeItem(item.id, null)}>
                    <span>{item.desc}</span>
                    {item.amount ? <span className="amount">${item.amount}</span> : null}
                  </div>
                ))}
              </div>
            </div>
            <div className="column credit">
              <h3>CREDIT (Right)</h3>
              <div className="drop-zone">
                {sortItems.filter((i) => i.placed === 'credit').map((item) => (
                  <div key={item.id} className={`item ${item.placed === item.side ? 'correct' : item.placed ? 'wrong' : ''}`} onClick={() => placeItem(item.id, null)}>
                    <span>{item.desc}</span>
                    {item.amount ? <span className="amount">${item.amount}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pool">
            <h3>Items to Sort</h3>
            <div className="pool-items">
              {sortItems.filter((i) => !i.placed).map((item) => (
                <div key={item.id} className="item" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: 180 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.desc}</span>
                    {item.amount ? <span className="amount">${item.amount}</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    <button className="btn btn-debit" style={{ flex: 1, padding: '4px' }} onClick={() => placeItem(item.id, 'debit')}>Debit</button>
                    <button className="btn btn-credit" style={{ flex: 1, padding: '4px' }} onClick={() => placeItem(item.id, 'credit')}>Credit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'balance' && currentSheet && (
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <h2>{currentSheet.title} <span className="level-badge">Lvl {currentSheet.level}</span></h2>
            <div>
              <button className="btn btn-ghost" onClick={() => loadSheet(sheetIndex + 1)}>Next Sheet</button>
              <button className="btn btn-primary" onClick={checkSheetAnswers} style={{ marginLeft: 6 }}>Check My Work</button>
            </div>
          </div>
          <p style={{ background: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <strong>Statement:</strong> {currentSheet.statement}
          </p>

          <div className="equation">
            Assets <strong>${totalAssets.toLocaleString()}</strong> = Liabilities <strong>${totalLiab.toLocaleString()}</strong> + Equity <strong>${totalEquity.toLocaleString()}</strong>
          </div>

          <div className="bs-grid">
            <div className="bs-section">
              <h3 style={{ color: 'var(--debit)' }}>Assets</h3>
              {Object.entries(bsBalances.assets).map(([k, v]) => (
                <div key={k} className="bs-row"><span>{k}</span><span>${v.toLocaleString()}</span></div>
              ))}
              <div className="bs-total"><span>Total</span><span>${totalAssets.toLocaleString()}</span></div>
            </div>
            <div className="bs-section">
              <h3 style={{ color: 'var(--credit)' }}>Liabilities + Equity</h3>
              {Object.entries(bsBalances.liabilities).map(([k, v]) => (
                <div key={k} className="bs-row"><span>{k}</span><span>${v.toLocaleString()}</span></div>
              ))}
              {Object.entries(bsBalances.equity).map(([k, v]) => (
                <div key={k} className="bs-row"><span>{k}</span><span>${v.toLocaleString()}</span></div>
              ))}
              <div className="bs-total"><span>Total L+E</span><span>${(totalLiab + totalEquity).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="entry-builder">
            <h3 style={{ marginBottom: 8 }}>Build Journal Entry</h3>
            <label>Description (optional)</label>
            <input value={currentEntryDesc} onChange={(e) => setCurrentEntryDesc(e.target.value)} placeholder="e.g. Owner investment" style={{ marginBottom: 10 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <strong style={{ color: 'var(--debit)' }}>Debits</strong>
                {debitRows.map((row, idx) => (
                  <div key={idx} className="entry-row">
                    <select value={row.account} onChange={(e) => {
                      const n = [...debitRows]; n[idx].account = e.target.value; setDebitRows(n);
                    }}>
                      {allAccounts.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <input type="number" value={row.amount || ''} onChange={(e) => {
                      const n = [...debitRows]; n[idx].amount = Number(e.target.value); setDebitRows(n);
                    }} placeholder="Amount" />
                  </div>
                ))}
                <button className="btn btn-ghost" style={{ marginTop: 4, fontSize: '0.8rem' }} onClick={() => setDebitRows([...debitRows, { account: 'Cash', amount: 0 }])}>+ Debit line</button>
              </div>
              <div>
                <strong style={{ color: 'var(--credit)' }}>Credits</strong>
                {creditRows.map((row, idx) => (
                  <div key={idx} className="entry-row">
                    <select value={row.account} onChange={(e) => {
                      const n = [...creditRows]; n[idx].account = e.target.value; setCreditRows(n);
                    }}>
                      {allAccounts.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <input type="number" value={row.amount || ''} onChange={(e) => {
                      const n = [...creditRows]; n[idx].amount = Number(e.target.value); setCreditRows(n);
                    }} placeholder="Amount" />
                  </div>
                ))}
                <button className="btn btn-ghost" style={{ marginTop: 4, fontSize: '0.8rem' }} onClick={() => setCreditRows([...creditRows, { account: "Owner's Capital", amount: 0 }])}>+ Credit line</button>
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={applyUserEntry}>Record Entry</button>
          </div>

          {userEntries.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h4>Your recorded entries</h4>
              {userEntries.map((e, i) => (
                <div key={i} style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>
                  {i + 1}. {e.description}: Dr {e.debits.map((d) => `${d.account} $${d.amount}`).join(', ')} / Cr {e.credits.map((c) => `${c.account} $${c.amount}`).join(', ')}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'quiz' && quizQ && (
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2>Quiz Mode <span className="level-badge">Score {quizScore}</span></h2>
            <button className="btn btn-primary" onClick={startQuiz}>Next Question</button>
          </div>
          <p style={{ fontSize: '1.1rem', marginBottom: 14 }}>{quizQ.question}</p>
          {quizQ.options.map((opt, idx) => (
            <button
              key={idx}
              className={`quiz-option ${quizSelected === idx ? 'selected' : ''} ${
                quizAnswered ? (idx === quizQ.correctIndex ? 'correct' : quizSelected === idx ? 'wrong' : '') : ''
              }`}
              onClick={() => !quizAnswered && setQuizSelected(idx)}
              disabled={quizAnswered}
            >
              {opt}
            </button>
          ))}
          {!quizAnswered ? (
            <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={submitQuiz} disabled={quizSelected === null}>
              Submit Answer
            </button>
          ) : (
            <div className={`feedback ${quizSelected === quizQ.correctIndex ? 'success' : 'error'}`} style={{ marginTop: 12 }}>
              {quizSelected === quizQ.correctIndex ? 'Correct! +15 points' : 'Incorrect'}
              <br />
              <span style={{ fontWeight: 400 }}>{quizQ.explanation}</span>
            </div>
          )}
        </section>
      )}

      {tab === 'classroom' && (
        <section className="panel">
          <h2>Classroom Mode</h2>
          <p style={{ color: 'var(--muted)', margin: '8px 0 16px' }}>
            Create a class code and share it with students.
          </p>
          <div className="form-row">
            <div>
              <label>Your name</label>
              <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Teacher or Student name" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
            <div>
              <button className="btn btn-primary" onClick={generateCode}>Generate Class Code</button>
              {classCode && (
                <div style={{ marginTop: 10 }}>
                  <span className="classroom-code">{classCode}</span>
                </div>
              )}
            </div>
            <div>
              <label>Join existing class</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={joinedCode} onChange={(e) => setJoinedCode(e.target.value)} placeholder="Enter code" style={{ width: 140 }} />
                <button className="btn btn-credit" onClick={joinClass}>Join</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === 'community' && (
        <section className="panel">
          <h2>Add Content for Everyone</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
            Publish items or balance sheet challenges. When publishing a sheet you must include the correct answers. Others only see the statement.
          </p>

          <h3 style={{ marginBottom: 8 }}>Add Sort Item</h3>
          <div className="form-row">
            <div style={{ flex: 2 }}>
              <label>Description</label>
              <input value={newItem.desc} onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })} placeholder="e.g. Increase in Prepaid Rent" />
            </div>
            <div>
              <label>Side</label>
              <select value={newItem.side} onChange={(e) => setNewItem({ ...newItem, side: e.target.value as any })}>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <div>
              <label>Amount</label>
              <input type="number" value={newItem.amount} onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })} />
            </div>
            <div>
              <label>Category</label>
              <select value={newItem.cat} onChange={(e) => setNewItem({ ...newItem, cat: e.target.value })}>
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label>Your name</label>
              <input value={newItem.author} onChange={(e) => setNewItem({ ...newItem, author: e.target.value })} placeholder="Anonymous" />
            </div>
            <div>
              <label>&nbsp;</label>
              <button className="btn btn-primary" onClick={submitItem}>Publish Item</button>
            </div>
          </div>

          <h3 style={{ margin: '24px 0 8px' }}>Publish Balance Sheet Challenge</h3>
          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label>Title</label>
              <input value={newSheet.title} onChange={(e) => setNewSheet({ ...newSheet, title: e.target.value })} placeholder="e.g. Month-end adjustments" />
            </div>
            <div>
              <label>Level</label>
              <select value={newSheet.level} onChange={(e) => setNewSheet({ ...newSheet, level: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label>Author</label>
              <input value={newSheet.author} onChange={(e) => setNewSheet({ ...newSheet, author: e.target.value })} />
            </div>
          </div>
          <label>Statement (what students will see)</label>
          <textarea value={newSheet.statement} onChange={(e) => setNewSheet({ ...newSheet, statement: e.target.value })} placeholder="Describe the transactions…" />

          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={submitSheet}>Publish Challenge</button>
        </section>
      )}

      <footer>
        Debit ↔ Credit Puzzle · Built for accounting students · Double-entry forever · Deploy on Vercel
      </footer>
    </div>
  );
}
