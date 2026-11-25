import React, { useEffect, useState } from 'react';
import {
  CATEGORIES,
  createTransaction,
  calculateSummary,
  expensesByCategory,
  isOverBudget,
} from './budget.js';

const STORAGE_KEY = 'budget-tracker:transactions';
const LIMIT = 500;

const CATEGORY_COLORS = {
  Food: '#F2B544',
  Rent: '#7FA7E8',
  Transport: '#5CC7B5',
  Fun: '#E88BB0',
  Salary: '#B9D87A',
  Other: '#A7B2B8',
};

const fmt = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export default function App() {
  const [transactions, setTransactions] = useState(load);
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense', category: 'Food' });
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const summary = calculateSummary(transactions);
  const byCategory = expensesByCategory(transactions);
  const over = isOverBudget(transactions, LIMIT);

  // The bar is scaled to the limit, or to total spending once spending passes it.
  const scale = Math.max(LIMIT, summary.expenses);
  const segments = Object.entries(byCategory);
  const limitAt = (LIMIT / scale) * 100;
  const left = LIMIT - summary.expenses;

  function submit(e) {
    e.preventDefault();
    try {
      setTransactions([...transactions, createTransaction(form)]);
      setForm({ ...form, description: '', amount: '' });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  function remove(index) {
    setTransactions(transactions.filter((_, i) => i !== index));
  }

  const rows = transactions.map((t, index) => ({ t, index })).reverse();

  return (
    <div className="page">
      <header className="top">
        <h1>Budget Tracker</h1>
        <p className="month">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </header>

      <section className="hero" aria-label="Summary">
        <div className="hero-main">
          <p className="label">Balance</p>
          <p className={`balance${summary.balance < 0 ? ' negative' : ''}`}>
            <span data-testid="balance">{fmt(summary.balance)}</span>
          </p>
        </div>
        <dl className="hero-side">
          <div>
            <dt>Income</dt>
            <dd data-testid="income">{fmt(summary.income)}</dd>
          </div>
          <div>
            <dt>Expenses</dt>
            <dd data-testid="expenses">{fmt(summary.expenses)}</dd>
          </div>
        </dl>

        <div className="meter">
          <div className="meter-head">
            <p className="label">Monthly limit {fmt(LIMIT)}</p>
            {over ? (
              <p role="alert" className="over">
                Over budget by {fmt(-left)}
              </p>
            ) : (
              <p className="left">{fmt(left)} left</p>
            )}
          </div>
          <div
            className="bar"
            role="img"
            aria-label={`Spent ${fmt(summary.expenses)} of ${fmt(LIMIT)} limit`}
          >
            {segments.map(([category, value]) => (
              <span
                key={category}
                className="seg"
                style={{ width: `${(value / scale) * 100}%`, background: CATEGORY_COLORS[category] }}
              />
            ))}
            <span className="notch" style={{ left: `${limitAt}%` }} />
          </div>
          {segments.length > 0 ? (
            <ul className="legend">
              {segments.map(([category, value]) => (
                <li key={category}>
                  <span className="dot" style={{ background: CATEGORY_COLORS[category] }} />
                  {category}
                  <span className="num">{fmt(value)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">Spending by category appears here.</p>
          )}
        </div>
      </section>

      <main className="grid">
        <section className="card" aria-labelledby="new-title">
          <h2 id="new-title">New transaction</h2>
          <form onSubmit={submit} noValidate>
            <label htmlFor="description">Description</label>
            <input
              id="description"
              value={form.description}
              placeholder="Groceries"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              inputMode="decimal"
              value={form.amount}
              placeholder="0.00"
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <div className="pair">
              <div>
                <label htmlFor="type">Type</label>
                <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button type="submit" className="primary">Add</button>
          </form>
        </section>

        <section className="card" aria-labelledby="list-title">
          <h2 id="list-title">Transactions</h2>
          {rows.length === 0 ? (
            <p className="empty">Nothing recorded yet. Add an income or expense to start.</p>
          ) : (
            <ul className="rows">
              {rows.map(({ t, index }) => (
                <li key={`${t.description}-${index}`}>
                  <span className="dot" style={{ background: CATEGORY_COLORS[t.category] }} />
                  <span className="desc">
                    {t.description}
                    <small>{t.category}</small>
                  </span>
                  <span className={`amt ${t.type}`}>
                    {t.type === 'income' ? '+' : '−'}
                    {fmt(t.amount)}
                  </span>
                  <button className="del" onClick={() => remove(index)} aria-label={`Delete ${t.description}`}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
