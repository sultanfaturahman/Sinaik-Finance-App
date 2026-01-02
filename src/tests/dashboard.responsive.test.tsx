import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Dashboard from '@/pages/Dashboard';

const orderMock = vi.fn().mockResolvedValue({
  data: [
    { type: 'income', amount: 200000 },
    { type: 'expense', amount: 50000 },
  ],
  error: null,
});
const eqMock = vi.fn(() => ({ order: orderMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));
const getSupabaseClientMock = vi.fn().mockResolvedValue({
  from: fromMock,
});

vi.mock('@/integrations/supabase/client', () => ({
  getSupabaseClient: getSupabaseClientMock,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, session: null, loading: false, signOut: vi.fn() }),
}));

vi.mock('@/hooks/useCategorySuggestions', () => ({
  useCategorySuggestions: () => ({
    onboardingCompleted: true,
    ready: true,
    setSector: vi.fn(),
    completeOnboarding: vi.fn(),
    resetOnboarding: vi.fn(),
    addSuggestion: vi.fn(),
    bulkAddSuggestions: vi.fn(),
    removeSuggestion: vi.fn(),
    suggestions: [],
  }),
}));

describe('Dashboard responsive grid', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    orderMock.mockResolvedValue({
      data: [
        { type: 'income', amount: 200000 },
        { type: 'expense', amount: 50000 },
      ],
      error: null,
    });
    eqMock.mockReturnValue({ order: orderMock });
    selectMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ select: selectMock });
    getSupabaseClientMock.mockResolvedValue({ from: fromMock });
  });

  it('renders stat cards grid with responsive classes', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByTestId('stats-grid')).toBeInTheDocument());

    const grid = screen.getByTestId('stats-grid');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('xl:grid-cols-4');
    expect(grid.querySelectorAll('[data-testid="stat-card"]').length).toBeGreaterThanOrEqual(4);
  });
});
