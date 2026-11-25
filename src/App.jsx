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

  return (
    <main className="app">
      <h1>Budget Tracker</h1>

      <section className="summary">
        <div>Income: <strong data-testid="income">{summary.income.toFixed(2)}</strong></div>
        <div>Expenses: <strong data-testid="expenses">{summary.expenses.toFixed(2)}</strong></div>
        <div>Balance: <strong data-testid="balance">{summary.balance.toFixed(2)}</strong></div>
      </section>
      {over && <p role="alert" className="warn">Over budget limit of {LIMIT}!</p>}

      <form onSubmit={submit}>
        <input
          aria-label="Description"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          aria-label="Amount"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <select aria-label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select
          aria-label="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button type="submit">Add</button>
      </form>
      {error && <p role="alert" className="error">{error}</p>}

      <ul>
        {transactions.map((t, i) => (
          <li key={`${t.description}-${i}`}>
            {t.description} ({t.category}) {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)}
            <button onClick={() => remove(i)} aria-label={`Delete ${t.description}`}>x</button>
          </li>
        ))}
      </ul>

      <h2>Expenses by category</h2>
      <ul>
        {Object.entries(byCategory).map(([c, v]) => <li key={c}>{c}: {v.toFixed(2)}</li>)}
      </ul>
    </main>
  );
}
