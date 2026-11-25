export const CATEGORIES = ['Food', 'Rent', 'Transport', 'Fun', 'Salary', 'Other'];

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Validate and build a transaction object.
 * Throws an Error with a clear message on invalid input.
 */
export function createTransaction({ description, amount, type, category = 'Other' }) {
  const text = typeof description === 'string' ? description.trim() : '';
  if (!text) throw new Error('Description is required');

  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Amount must be a positive number');
  }
  if (type !== 'income' && type !== 'expense') {
    throw new Error('Type must be income or expense');
  }
  return { description: text, amount: round2(value), type, category };
}

/** Total income, total expenses and balance for a list of transactions. */
export function calculateSummary(transactions) {
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount;
    else expenses += t.amount;
  }
  return { income: round2(income), expenses: round2(expenses), balance: round2(income - expenses) };
}

/** Sum of expenses per category. */
export function expensesByCategory(transactions) {
  const totals = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    totals[t.category] = round2((totals[t.category] || 0) + t.amount);
  }
  return totals;
}

/** True when expenses strictly exceed the budget limit. */
export function isOverBudget(transactions, limit) {
  if (!Number.isFinite(limit) || limit < 0) throw new Error('Limit must be zero or more');
  return calculateSummary(transactions).expenses > limit;
}
