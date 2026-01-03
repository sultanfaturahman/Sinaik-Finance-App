import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useFinancialSnapshot } from './useFinancialSnapshot';

const mockTransactionsChain = () => {
  const order = vi.fn().mockResolvedValue({
    data: [
      { type: 'income', amount: 100000, category: 'Penjualan Online', date: '2025-01-01' },
      { type: 'expense', amount: 40000, category: 'Bahan Baku', date: '2025-01-02' },
    ],
    error: null,
  });
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  return { select, eq, order };
};

const mockStatusChain = () => {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: { level: 'mikro', annual_revenue: 120000000 },
    error: null,
  });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  return { select, eq, maybeSingle };
};

let transactionsChain = mockTransactionsChain();
let statusChain = mockStatusChain();

const getSupabaseClient = vi.hoisted(() => vi.fn());
const mockSupabaseClient = {
  from: (table: string) => {
    if (table === 'transactions') {
      return { select: transactionsChain.select };
    }
    if (table === 'umkm_status') {
      return { select: statusChain.select };
    }
    throw new Error(`Unexpected table ${table}`);
  },
};
getSupabaseClient.mockResolvedValue(mockSupabaseClient);

vi.mock('@/integrations/supabase/client', () => ({
  getSupabaseClient,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, session: null, loading: false, signOut: vi.fn() }),
}));

describe('useFinancialSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionsChain = mockTransactionsChain();
    statusChain = mockStatusChain();
    getSupabaseClient.mockResolvedValue(mockSupabaseClient);
  });

  it('returns aggregated snapshot data', async () => {
    const { result } = renderHook(() => useFinancialSnapshot());

    await waitFor(() => expect(transactionsChain.order).toHaveBeenCalled());
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());

    expect(result.current.error).toBeNull();

    const snapshot = result.current.snapshot!;
    expect(snapshot.umkmLevel).toBe('mikro');
    expect(snapshot.yearToDate.totalIncome).toBe(100000);
    expect(snapshot.yearToDate.totalExpense).toBe(40000);
    expect(snapshot.yearToDate.netProfit).toBe(60000);
    expect(snapshot.topIncomeCategories[0].category).toBe('Penjualan Online');
    expect(transactionsChain.select).toHaveBeenCalledWith('type, amount, category, date');
    expect(statusChain.select).toHaveBeenCalledWith('level, annual_revenue');
  });
});
