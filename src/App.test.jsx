import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

beforeEach(() => localStorage.clear());

async function add(user, description, amount, type = 'expense') {
  await user.type(screen.getByLabelText('Description'), description);
  await user.type(screen.getByLabelText('Amount'), amount);
  await user.selectOptions(screen.getByLabelText('Type'), type);
  await user.click(screen.getByText('Add'));
}

describe('App', () => {
  it('adds transactions and updates the balance', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'Pay', '100', 'income');
    await add(user, 'Lunch', '30');
    expect(screen.getByTestId('income')).toHaveTextContent('100.00');
    expect(screen.getByTestId('expenses')).toHaveTextContent('30.00');
    expect(screen.getByTestId('balance')).toHaveTextContent('70.00');
  });

  it('shows an error for an invalid amount', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'Bad', '-5');
    expect(screen.getByRole('alert')).toHaveTextContent('Amount must be a positive number');
  });

  it('warns when over the budget limit and can delete', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'Car', '600');
    expect(screen.getByRole('alert')).toHaveTextContent('Over budget');
    await user.click(screen.getByLabelText('Delete Car'));
    expect(screen.getByTestId('expenses')).toHaveTextContent('0.00');
  });
});
