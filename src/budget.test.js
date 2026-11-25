import { describe, it, expect } from 'vitest';
import {
  createTransaction,
  calculateSummary,
  expensesByCategory,
  isOverBudget,
} from './budget.js';

const sample = [
  { description: 'Pay', amount: 1000, type: 'income', category: 'Salary' },
  { description: 'Lunch', amount: 12.5, type: 'expense', category: 'Food' },
  { description: 'Dinner', amount: 20.25, type: 'expense', category: 'Food' },
  { description: 'Bus', amount: 5, type: 'expense', category: 'Transport' },
];

describe('createTransaction', () => {
  it('builds a valid transaction and trims/rounds input', () => {
    expect(
      createTransaction({ description: '  Coffee ', amount: '3.456', type: 'expense', category: 'Food' })
    ).toEqual({ description: 'Coffee', amount: 3.46, type: 'expense', category: 'Food' });
  });

  it('defaults the category to Other', () => {
    expect(createTransaction({ description: 'Gift', amount: 10, type: 'income' }).category).toBe('Other');
  });

  it('rejects an empty description', () => {
    expect(() => createTransaction({ description: '  ', amount: 5, type: 'expense' })).toThrow(
      'Description is required'
    );
  });

  it.each([0, -5, 'abc', NaN])('rejects invalid amount %s (boundary: zero and negatives)', (amount) => {
    expect(() => createTransaction({ description: 'x', amount, type: 'expense' })).toThrow(
      'Amount must be a positive number'
    );
  });

  it('rejects an unknown type', () => {
    expect(() => createTransaction({ description: 'x', amount: 5, type: 'gift' })).toThrow('Type must be');
  });
});

describe('calculateSummary', () => {
  it('computes income, expenses and a positive balance', () => {
    expect(calculateSummary(sample)).toEqual({ income: 1000, expenses: 37.75, balance: 962.25 });
  });

  it('returns a negative balance when expenses exceed income', () => {
    const s = calculateSummary([{ description: 'Rent', amount: 500, type: 'expense', category: 'Rent' }]);
    expect(s.balance).toBe(-500);
  });

  it('returns zeros for an empty list', () => {
    expect(calculateSummary([])).toEqual({ income: 0, expenses: 0, balance: 0 });
  });
});

describe('expensesByCategory', () => {
  it('groups only expenses by category', () => {
    expect(expensesByCategory(sample)).toEqual({ Food: 32.75, Transport: 5 });
  });
});

describe('isOverBudget', () => {
  it('is false when expenses equal the limit (boundary)', () => {
    expect(isOverBudget(sample, 37.75)).toBe(false);
  });
  it('is true when expenses exceed the limit', () => {
    expect(isOverBudget(sample, 37)).toBe(true);
  });
  it('throws for a negative limit', () => {
    expect(() => isOverBudget(sample, -1)).toThrow('Limit must be zero or more');
  });
});
