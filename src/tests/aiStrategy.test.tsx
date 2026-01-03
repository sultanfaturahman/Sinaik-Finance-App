import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AIStrategy from '@/pages/AIStrategy';

const getSupabaseClientMock = vi.hoisted(() => vi.fn());

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

const mockSnapshot = {
  umkmLevel: 'mikro',
  annualRevenue: 100_000_000,
  yearToDate: {
    totalIncome: 50_000_000,
    totalExpense: 30_000_000,
    netProfit: 20_000_000,
    profitMargin: 40,
    transactionCount: 25,
  },
  topIncomeCategories: [{ category: 'Online', amount: 30_000_000, percentage: '60' }],
  topExpenseCategories: [{ category: 'Operasional', amount: 15_000_000, percentage: '50' }],
  monthlyTrends: [],
};

vi.mock('@/hooks/useFinancialSnapshot', () => ({
  useFinancialSnapshot: () => ({
    snapshot: mockSnapshot,
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

const STRATEGY_STORAGE_KEY = 'sinaik:strategy-data:user-1';

describe('AI Strategy page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('restores cached strategy summary and renders action items', async () => {
    const cachedStrategy = {
      strategy: {
        analysis: {
          summary: 'Bisnis tumbuh positif tetapi perlu fokus ke pemasaran digital.',
          key_metrics: [{ label: 'Margin', value: '40%' }],
        },
        revenue_strategies: [
          {
            id: 'rev-1',
            title: 'Optimalkan penjualan online',
            description: 'Perkuat promosi marketplace',
            expected_impact: 'Rp 5.000.000',
          },
        ],
        cost_strategies: [
          {
            id: 'cost-1',
            title: 'Efisiensi bahan baku',
            description: 'Evaluasi supplier utama',
            expected_savings: 'Rp 2.000.000',
          },
        ],
        action_plan: [
          {
            id: 'week-1',
            title: 'Minggu 1',
            timeframe: 'Minggu 1',
            summary: 'Audit kanal penjualan',
            tasks: [
              {
                id: 'week-1-task-1',
                title: 'Review campaign iklan',
                owner: 'Tim Marketing',
                metric: '3 kampanye',
              },
            ],
          },
        ],
        targets: [{ label: 'Target 90 hari', value: 'Naikkan omzet 25%' }],
      },
      rawStrategy: '## Ringkasan\nBisnis tumbuh positif.',
      financialSnapshot: mockSnapshot,
      formState: {
        profile: {
          businessName: 'SiNaik Mart',
          sector: 'Retail',
          targetMarket: 'UMKM Digital',
          teamSize: '5',
          differentiator: 'Pelayanan cepat',
        },
        financialSummary: {
          revenueYtd: '100000000',
          expenseYtd: '50000000',
          netProfitYtd: '50000000',
          profitMargin: '50',
          noteworthyTrend: 'Penjualan marketplace naik 20%',
        },
        goals: {
          primary: 'Naikkan omzet 25%',
          secondary: 'Tambah channel digital',
          timeframe: 'Q1',
          risks: 'Persaingan marketplace',
        },
      },
      planVersion: 'week-1|week-1-task-1',
      cacheMeta: { cacheHit: false, createdAt: new Date().toISOString(), model: 'gemini-pro' },
      model: 'gemini-pro',
      generatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(cachedStrategy));

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AIStrategy />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText(/Bisnis tumbuh positif/i)).toBeInTheDocument());

    expect(screen.getByText(/Optimalkan penjualan online/i)).toBeInTheDocument();
    expect(screen.getByText(/Review campaign iklan/i)).toBeInTheDocument();
    expect(screen.getByText(/Target 90 hari/i)).toBeInTheDocument();
  });
});
