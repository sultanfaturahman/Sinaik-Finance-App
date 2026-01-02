import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AIStrategy from '@/pages/AIStrategy';

const invokeMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const selectMock = vi.hoisted(() => vi.fn());
const eqMock = vi.hoisted(() => vi.fn());
const maybeSingleMock = vi.hoisted(() => vi.fn());
const getSupabaseClientMock = vi.hoisted(() => vi.fn());
const supabaseClient = {
  functions: {
    invoke: invokeMock,
  },
  auth: {
    getSession: getSessionMock,
  },
  from: fromMock,
};

vi.mock('@/integrations/supabase/client', () => ({
  getSupabaseClient: getSupabaseClientMock,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, session: null, loading: false, signOut: vi.fn() }),
}));

vi.mock('@/app/AppShell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div data-testid="app-shell">{children}</div>,
}));

vi.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useFinancialSnapshot', () => ({
  useFinancialSnapshot: () => ({
    snapshot: {
      umkmLevel: 'mikro',
      annualRevenue: 100_000_000,
      yearToDate: {
        totalIncome: 50000000,
        totalExpense: 30000000,
        netProfit: 20000000,
        profitMargin: 40,
        transactionCount: 25,
      },
      topIncomeCategories: [{ category: 'Online', amount: 30000000, percentage: '60' }],
      topExpenseCategories: [{ category: 'Operasional', amount: 15000000, percentage: '50' }],
      monthlyTrends: [],
    },
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AI Strategy page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    invokeMock.mockReset();
    getSessionMock.mockReset();
    fromMock.mockReset();
    selectMock.mockReset();
    eqMock.mockReset();
    maybeSingleMock.mockReset();
    getSupabaseClientMock.mockReset();
    getSupabaseClientMock.mockResolvedValue(supabaseClient);

    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-123' } } });

    fromMock.mockReturnValue({ select: selectMock });
    selectMock.mockReturnValue({ eq: eqMock });
    eqMock.mockReturnValue({ maybeSingle: maybeSingleMock });
    maybeSingleMock.mockResolvedValue({
      data: {
        id: 'user-1',
        business_name: 'SiNaik Mart',
        name: 'Owner',
        email: 'owner@example.com',
      },
      error: null,
    });

    invokeMock.mockResolvedValue({
      data: {
        cacheHit: false,
        strategy: {
          analysis: {
            summary: 'Bisnis tumbuh positif tetapi perlu fokus ke pemasaran digital.',
            key_metrics: [{ label: 'Margin', value: '40%' }],
          },
          revenue_strategies: [
            { id: 'rev-1', title: 'Optimalkan penjualan online', description: 'Perkuat promosi marketplace', expected_impact: 'Rp 5.000.000' },
          ],
          cost_strategies: [
            { id: 'cost-1', title: 'Efisiensi bahan baku', description: 'Evaluasi supplier utama', expected_savings: 'Rp 2.000.000' },
          ],
          action_plan: [
            {
              id: 'week-1',
              title: 'Minggu 1',
              timeframe: 'Minggu 1',
              summary: 'Audit kanal penjualan',
              tasks: [
                { id: 'week-1-task-1', title: 'Review campaign iklan', owner: 'Tim Marketing', metric: '3 kampanye' },
              ],
            },
          ],
          targets: [{ label: 'Target 90 hari', value: 'Naikkan omzet 25%' }],
        },
      },
      error: null,
    });
  });

  it('generates strategy and renders summary & action list', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AIStrategy />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const button = screen.getByRole('button', { name: /hasilkan strategi bisnis/i });
    fireEvent.click(button);

    await waitFor(() => expect(invokeMock).toHaveBeenCalled());

    await waitFor(() =>
      expect(screen.getByText(/Bisnis tumbuh positif/i)).toBeInTheDocument(),
    );

    expect(screen.getByText(/Optimalkan penjualan online/i)).toBeInTheDocument();
    expect(screen.getByText(/Review campaign iklan/i)).toBeInTheDocument();
  });
});
