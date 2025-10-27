import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AIStrategy from '@/pages/AIStrategy';

const invokeMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
    auth: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, session: null, loading: false, signOut: vi.fn() }),
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

describe('AI Strategy page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeMock.mockReset();
    getSessionMock.mockReset();

    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-123' } } });

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
      <MemoryRouter>
        <AIStrategy />
      </MemoryRouter>,
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
