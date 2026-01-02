import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
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
const insertMock = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn().mockResolvedValue({ error: null });
const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
const deleteMock = vi.fn(() => ({ eq: deleteEqMock }));
const fromMock = vi.fn(() => ({
  select: selectMock,
  insert: insertMock,
  update: updateMock,
  delete: deleteMock,
}));
const getSupabaseClientMock = vi.fn().mockResolvedValue({ from: fromMock });

vi.mock('@/integrations/supabase/client', () => ({
  getSupabaseClient: getSupabaseClientMock,
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

const renderTransactions = async (client: QueryClient) => {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Transactions />
      </MemoryRouter>
    </QueryClientProvider>
  );
  await waitFor(() => expect(orderMock).toHaveBeenCalled());
};

describe('Transactions responsive layout', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    orderMock.mockResolvedValue({ data: sampleTransactions, error: null });
    eqMock.mockReturnValue({ order: orderMock });
    selectMock.mockReturnValue({ eq: eqMock });
    insertMock.mockResolvedValue({ error: null });
    updateMock.mockResolvedValue({ error: null });
    deleteEqMock.mockResolvedValue({ error: null });
    deleteMock.mockReturnValue({ eq: deleteEqMock });
    fromMock.mockReturnValue({
      select: selectMock,
      insert: insertMock,
      update: updateMock,
      delete: deleteMock,
    });
    getSupabaseClientMock.mockResolvedValue({ from: fromMock });
    localStorage.clear();
  });

  it('displays card list on mobile viewport', async () => {
    window.innerWidth = 390;
    window.dispatchEvent(new Event('resize'));

    await renderTransactions(queryClient);

    await waitFor(() => expect(screen.getByText(/Penjualan Online/i)).toBeInTheDocument());
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('displays table on desktop viewport', async () => {
    window.innerWidth = 1024;
    window.dispatchEvent(new Event('resize'));

    await renderTransactions(queryClient);

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
  });
});

