import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTransaction } from './AddTransaction';

describe('AddTransaction', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('renders the simulator form', () => {
    render(<AddTransaction />);

    expect(screen.getByRole('heading', { name: 'Transaction Simulator' })).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Transaction' })).toBeInTheDocument();
  });

  it('submits a transaction and shows success feedback', async () => {
    const user = userEvent.setup();
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(<AddTransaction />);

    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '42.5');
    await user.selectOptions(screen.getByLabelText('Currency'), 'EUR');
    await user.selectOptions(screen.getByLabelText('Status'), 'Completed');
    await user.click(screen.getByRole('button', { name: 'Submit Transaction' }));

    await waitFor(() => {
      expect(screen.getByText('Transaction submitted successfully.')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5289/api/transactions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(requestInit?.body)) as {
      amount: number;
      currency: string;
      status: string;
    };

    expect(body.amount).toBe(42.5);
    expect(body.currency).toBe('EUR');
    expect(body.status).toBe('Completed');
  });

  it('shows an error message when the API rejects the request', async () => {
    const user = userEvent.setup();
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Amount must be positive' }),
    } as Response);

    render(<AddTransaction />);
    await user.click(screen.getByRole('button', { name: 'Submit Transaction' }));

    await waitFor(() => {
      expect(screen.getByText('Amount must be positive')).toBeInTheDocument();
    });
  });
});
