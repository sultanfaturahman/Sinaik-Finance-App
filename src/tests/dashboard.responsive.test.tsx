import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';

const orderMock = vi.fn().mockResolvedValue({
  data: [
    { type: 'income', amount: 200000 },
    { type: 'expense', amount: 50000 },
  ],
  error: null,
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(), order: orderMock })) })),
    })),
  },
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stat cards grid with responsive classes', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId('stats-grid')).toBeInTheDocument());

    const grid = screen.getByTestId('stats-grid');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('xl:grid-cols-4');
    expect(grid.querySelectorAll('[data-testid="stat-card"]').length).toBeGreaterThanOrEqual(4);
  });
});
