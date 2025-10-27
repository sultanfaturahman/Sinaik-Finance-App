import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Transactions from '@/pages/Transactions';

const sampleTransactions = [
  {
    id: 'txn-1',
    user_id: 'user-1',
    type: 'income' as const,
    amount: 125000,
    category: 'Penjualan Online',
    date: '2025-01-10',
    note: 'Shopee',
    source: 'manual' as const,
    created_at: '',
    updated_at: '',
  },
];

const orderMock = vi.fn().mockResolvedValue({ data: sampleTransactions, error: null });
const eqMock = vi.fn().mockReturnValue({ order: orderMock });
const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: selectMock,
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    })),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, session: null, loading: false, signOut: vi.fn() }),
}));

vi.mock('@/hooks/useCategorySuggestions', () => ({
  useCategorySuggestions: () => ({
    suggestions: [],
    addSuggestion: vi.fn(),
    bulkAddSuggestions: vi.fn(),
    removeSuggestion: vi.fn(),
  }),
}));

const renderTransactions = async () => {
  render(
    <MemoryRouter>
      <Transactions />
    </MemoryRouter>
  );
  await waitFor(() => expect(orderMock).toHaveBeenCalled());
};

describe('Transactions responsive layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('displays card list on mobile viewport', async () => {
    window.innerWidth = 390;
    window.dispatchEvent(new Event('resize'));

    await renderTransactions();

    await waitFor(() => expect(screen.getByText(/Penjualan Online/i)).toBeInTheDocument());
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('displays table on desktop viewport', async () => {
    window.innerWidth = 1024;
    window.dispatchEvent(new Event('resize'));

    await renderTransactions();

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
  });
});

