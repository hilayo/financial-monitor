import { useState } from 'react';
import type { FormEvent } from 'react';
import { API_BASE_URL } from '../types/transaction';
import type { TransactionRequest, TransactionStatus } from '../types/transaction';
import './AddTransaction.css';

const currencies = ['USD', 'EUR', 'GBP', 'ILS'];
const statuses: TransactionStatus[] = ['Pending', 'Completed', 'Failed'];

function createMockTransaction(): TransactionRequest {
  return {
    transactionId: crypto.randomUUID(),
    amount: Number((Math.random() * 9990 + 10).toFixed(2)),
    currency: currencies[Math.floor(Math.random() * currencies.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    timestamp: new Date().toISOString(),
  };
}

export function AddTransaction() {
  const [form, setForm] = useState<TransactionRequest>({
    transactionId: crypto.randomUUID(),
    amount: 1500.5,
    currency: 'USD',
    status: 'Pending',
    timestamp: new Date().toISOString(),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitTransaction(payload: TransactionRequest) {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        throw new Error(errorBody.error ?? 'Failed to submit transaction');
      }

      setIsError(false);
      setMessage('Transaction submitted successfully.');
      setForm((current) => ({
        ...current,
        transactionId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitTransaction(form);
  }

  function handleGenerateMock() {
    void submitTransaction(createMockTransaction());
  }

  async function handleBurstGenerate() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const requests = Array.from({ length: 100 }, () => createMockTransaction());
      await Promise.all(
        requests.map((payload) =>
          fetch(`${API_BASE_URL}/api/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }),
        ),
      );
      setIsError(false);
      setMessage('Submitted 100 mock transactions.');
    } catch {
      setIsError(true);
      setMessage('Failed while submitting burst transactions.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="add-page">
      <header>
        <h1>Transaction Simulator</h1>
        <p>Simulate external systems feeding transaction data into the monitor.</p>
      </header>

      <form className="add-form" onSubmit={handleSubmit}>
        <label>
          Amount
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) =>
              setForm((current) => ({ ...current, amount: Number(event.target.value) }))
            }
            required
          />
        </label>

        <label>
          Currency
          <select
            value={form.currency}
            onChange={(event) =>
              setForm((current) => ({ ...current, currency: event.target.value }))
            }
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as TransactionStatus,
              }))
            }
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <div className="button-row">
          <button type="submit" disabled={isSubmitting}>
            Submit Transaction
          </button>
          <button type="button" onClick={handleGenerateMock} disabled={isSubmitting}>
            Generate Mock
          </button>
          <button type="button" onClick={() => void handleBurstGenerate()} disabled={isSubmitting}>
            Generate 100
          </button>
        </div>
      </form>

      {message && <p className={isError ? 'feedback error' : 'feedback success'}>{message}</p>}
    </section>
  );
}
