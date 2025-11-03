# SiNaik Testing Strategy

**Version:** 1.0
**Last Updated:** October 30, 2025
**Status:** Implementation Ready

---

## Overview

This document outlines the comprehensive testing strategy for SiNaik. Given that we're dealing with financial data, testing is **CRITICAL** - errors in calculations could have serious business consequences for UMKM owners.

---

## Testing Pyramid

```
                    ┌────────────┐
                    │    E2E     │  5%  - Critical user flows
                    │   Tests    │
                ┌───┴────────────┴───┐
                │  Integration Tests │  15% - API + Database
            ┌───┴────────────────────┴───┐
            │     Component Tests        │  30% - React components
        ┌───┴────────────────────────────┴───┐
        │         Unit Tests                 │  50% - Pure functions, utilities
        └────────────────────────────────────┘
```

---

## Critical Coverage Areas (100% Required)

These areas MUST have 100% test coverage due to financial impact:

### 1. Financial Calculations
- **File:** `src/lib/calculations.ts` (to be created)
- Income/expense totals
- Net profit calculations
- Profit margin percentages
- Year-to-date aggregations
- Category breakdowns

### 2. UMKM Classification Logic
- **Files:** `src/lib/umkmClassification.ts` (to be created)
- Classification thresholds (Ultra Mikro, Super Mikro, Mikro, Kecil)
- Revenue tier calculations
- Progress to next level
- Gap analysis

### 3. AI Strategy Normalization
- **File:** `supabase/functions/generate-business-strategy/index.ts:153-223`
- JSON parsing from Gemini API
- Fallback handling for missing fields
- ID generation logic
- Data type coercion

### 4. Transaction Import/Export
- **Files:** Excel import logic
- CSV parsing
- Duplicate detection
- Data validation
- Category mapping

---

## Test Setup

### Installation

```bash
# Already installed in package.json
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        'dist/',
      ],
      // Coverage thresholds
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
      // Critical files require 100%
      include: [
        'src/lib/calculations.ts',
        'src/lib/umkmClassification.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Test Setup File

Create `src/tests/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      order: vi.fn(),
      single: vi.fn(),
    })),
  },
}))

// Mock window.localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any
```

---

## Unit Tests

### 1. Financial Calculations

Create `src/lib/calculations.ts`:

```typescript
/**
 * Core financial calculation utilities
 * CRITICAL: 100% test coverage required
 */

export const calculateNetProfit = (income: number, expense: number): number => {
  return income - expense
}

export const calculateProfitMargin = (income: number, expense: number): number => {
  if (income === 0) return 0
  const netProfit = calculateNetProfit(income, expense)
  return (netProfit / income) * 100
}

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export const aggregateByCategory = (
  transactions: Array<{ category: string; amount: number; type: 'income' | 'expense' }>
): Record<string, number> => {
  return transactions.reduce((acc, txn) => {
    acc[txn.category] = (acc[txn.category] || 0) + txn.amount
    return acc
  }, {} as Record<string, number>)
}
```

Create `src/tests/lib/calculations.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  calculateNetProfit,
  calculateProfitMargin,
  calculatePercentageChange,
  formatCurrency,
  aggregateByCategory,
} from '@/lib/calculations'

describe('Financial Calculations', () => {
  describe('calculateNetProfit', () => {
    it('should calculate positive profit correctly', () => {
      expect(calculateNetProfit(1000000, 600000)).toBe(400000)
    })

    it('should calculate negative profit (loss) correctly', () => {
      expect(calculateNetProfit(500000, 800000)).toBe(-300000)
    })

    it('should handle zero income', () => {
      expect(calculateNetProfit(0, 100000)).toBe(-100000)
    })

    it('should handle zero expense', () => {
      expect(calculateNetProfit(1000000, 0)).toBe(1000000)
    })

    it('should handle both zero', () => {
      expect(calculateNetProfit(0, 0)).toBe(0)
    })

    it('should handle large numbers', () => {
      expect(calculateNetProfit(999999999, 1)).toBe(999999998)
    })

    it('should handle decimal amounts', () => {
      expect(calculateNetProfit(1000.50, 500.25)).toBeCloseTo(500.25)
    })
  })

  describe('calculateProfitMargin', () => {
    it('should calculate profit margin correctly', () => {
      expect(calculateProfitMargin(1000000, 600000)).toBe(40)
    })

    it('should return 0 for zero income', () => {
      expect(calculateProfitMargin(0, 100000)).toBe(0)
    })

    it('should calculate negative margin for losses', () => {
      expect(calculateProfitMargin(500000, 800000)).toBe(-60)
    })

    it('should handle 100% profit margin', () => {
      expect(calculateProfitMargin(1000000, 0)).toBe(100)
    })

    it('should round to reasonable precision', () => {
      expect(calculateProfitMargin(1000000, 333333)).toBeCloseTo(66.6667, 2)
    })
  })

  describe('calculatePercentageChange', () => {
    it('should calculate increase correctly', () => {
      expect(calculatePercentageChange(150, 100)).toBe(50)
    })

    it('should calculate decrease correctly', () => {
      expect(calculatePercentageChange(80, 100)).toBe(-20)
    })

    it('should handle zero previous value', () => {
      expect(calculatePercentageChange(100, 0)).toBe(100)
    })

    it('should handle both zero', () => {
      expect(calculatePercentageChange(0, 0)).toBe(0)
    })

    it('should handle negative to positive', () => {
      expect(calculatePercentageChange(100, -100)).toBe(200)
    })
  })

  describe('formatCurrency', () => {
    it('should format positive amounts', () => {
      expect(formatCurrency(1000000)).toBe('Rp1.000.000')
    })

    it('should format negative amounts', () => {
      expect(formatCurrency(-500000)).toBe('-Rp500.000')
    })

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('Rp0')
    })

    it('should format large numbers', () => {
      expect(formatCurrency(1234567890)).toBe('Rp1.234.567.890')
    })

    it('should round decimals', () => {
      expect(formatCurrency(1000.99)).toBe('Rp1.001')
    })
  })

  describe('aggregateByCategory', () => {
    it('should aggregate transactions by category', () => {
      const transactions = [
        { category: 'Penjualan', amount: 1000000, type: 'income' as const },
        { category: 'Penjualan', amount: 500000, type: 'income' as const },
        { category: 'Transport', amount: 100000, type: 'expense' as const },
      ]

      const result = aggregateByCategory(transactions)

      expect(result).toEqual({
        Penjualan: 1500000,
        Transport: 100000,
      })
    })

    it('should handle empty array', () => {
      expect(aggregateByCategory([])).toEqual({})
    })

    it('should handle single transaction', () => {
      const transactions = [
        { category: 'Gaji', amount: 5000000, type: 'expense' as const },
      ]

      expect(aggregateByCategory(transactions)).toEqual({ Gaji: 5000000 })
    })
  })
})
```

---

### 2. UMKM Classification

Create `src/lib/umkmClassification.ts`:

```typescript
/**
 * UMKM classification based on Indonesian government regulations
 * CRITICAL: 100% test coverage required
 */

export type UMKMLevel = 'ultra_mikro' | 'super_mikro' | 'mikro' | 'kecil'

export interface ClassificationThresholds {
  ultra_mikro: { min: number; max: number }
  super_mikro: { min: number; max: number }
  mikro: { min: number; max: number }
  kecil: { min: number; max: number }
}

// Based on Indonesian UMKM regulations
export const THRESHOLDS: ClassificationThresholds = {
  ultra_mikro: { min: 0, max: 100_000_000 },       // Up to 100 million
  super_mikro: { min: 100_000_001, max: 300_000_000 }, // 100M - 300M
  mikro: { min: 300_000_001, max: 1_000_000_000 },     // 300M - 1B
  kecil: { min: 1_000_000_001, max: Infinity },         // Above 1B
}

export const classifyUMKM = (annualRevenue: number): UMKMLevel => {
  if (annualRevenue < 0) {
    throw new Error('Annual revenue cannot be negative')
  }

  if (annualRevenue <= THRESHOLDS.ultra_mikro.max) return 'ultra_mikro'
  if (annualRevenue <= THRESHOLDS.super_mikro.max) return 'super_mikro'
  if (annualRevenue <= THRESHOLDS.mikro.max) return 'mikro'
  return 'kecil'
}

export const getNextLevel = (currentLevel: UMKMLevel): UMKMLevel | null => {
  const levels: UMKMLevel[] = ['ultra_mikro', 'super_mikro', 'mikro', 'kecil']
  const currentIndex = levels.indexOf(currentLevel)

  if (currentIndex === levels.length - 1) return null // Already at max
  return levels[currentIndex + 1]
}

export const calculateGapToNextLevel = (
  annualRevenue: number,
  currentLevel: UMKMLevel
): number => {
  const nextLevel = getNextLevel(currentLevel)
  if (!nextLevel) return 0 // Already at max level

  const nextThreshold = THRESHOLDS[nextLevel].min
  return Math.max(0, nextThreshold - annualRevenue)
}

export const calculateProgress = (
  annualRevenue: number,
  currentLevel: UMKMLevel
): number => {
  const threshold = THRESHOLDS[currentLevel]

  if (threshold.max === Infinity) return 100

  const range = threshold.max - threshold.min + 1
  const progress = annualRevenue - threshold.min

  return Math.min(100, Math.max(0, (progress / range) * 100))
}

export const formatUMKMLevel = (level: UMKMLevel): string => {
  const labels = {
    ultra_mikro: 'Ultra Mikro',
    super_mikro: 'Super Mikro',
    mikro: 'Mikro',
    kecil: 'Kecil',
  }
  return labels[level]
}
```

Create `src/tests/lib/umkmClassification.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  classifyUMKM,
  getNextLevel,
  calculateGapToNextLevel,
  calculateProgress,
  formatUMKMLevel,
  THRESHOLDS,
} from '@/lib/umkmClassification'

describe('UMKM Classification', () => {
  describe('classifyUMKM', () => {
    it('should classify ultra mikro correctly', () => {
      expect(classifyUMKM(0)).toBe('ultra_mikro')
      expect(classifyUMKM(50_000_000)).toBe('ultra_mikro')
      expect(classifyUMKM(100_000_000)).toBe('ultra_mikro')
    })

    it('should classify super mikro correctly', () => {
      expect(classifyUMKM(100_000_001)).toBe('super_mikro')
      expect(classifyUMKM(200_000_000)).toBe('super_mikro')
      expect(classifyUMKM(300_000_000)).toBe('super_mikro')
    })

    it('should classify mikro correctly', () => {
      expect(classifyUMKM(300_000_001)).toBe('mikro')
      expect(classifyUMKM(500_000_000)).toBe('mikro')
      expect(classifyUMKM(1_000_000_000)).toBe('mikro')
    })

    it('should classify kecil correctly', () => {
      expect(classifyUMKM(1_000_000_001)).toBe('kecil')
      expect(classifyUMKM(5_000_000_000)).toBe('kecil')
    })

    it('should throw error for negative revenue', () => {
      expect(() => classifyUMKM(-1000)).toThrow('Annual revenue cannot be negative')
    })

    it('should handle boundary values precisely', () => {
      expect(classifyUMKM(THRESHOLDS.ultra_mikro.max)).toBe('ultra_mikro')
      expect(classifyUMKM(THRESHOLDS.ultra_mikro.max + 1)).toBe('super_mikro')
    })
  })

  describe('getNextLevel', () => {
    it('should return correct next level', () => {
      expect(getNextLevel('ultra_mikro')).toBe('super_mikro')
      expect(getNextLevel('super_mikro')).toBe('mikro')
      expect(getNextLevel('mikro')).toBe('kecil')
    })

    it('should return null for highest level', () => {
      expect(getNextLevel('kecil')).toBeNull()
    })
  })

  describe('calculateGapToNextLevel', () => {
    it('should calculate gap for ultra mikro', () => {
      expect(calculateGapToNextLevel(50_000_000, 'ultra_mikro')).toBe(50_000_001)
    })

    it('should calculate gap for super mikro', () => {
      expect(calculateGapToNextLevel(200_000_000, 'super_mikro')).toBe(100_000_001)
    })

    it('should return 0 for highest level', () => {
      expect(calculateGapToNextLevel(2_000_000_000, 'kecil')).toBe(0)
    })

    it('should return 0 if already at threshold', () => {
      expect(calculateGapToNextLevel(1_000_000_001, 'mikro')).toBe(0)
    })
  })

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      // At 50% of ultra mikro range
      const midpoint = (THRESHOLDS.ultra_mikro.max + THRESHOLDS.ultra_mikro.min) / 2
      expect(calculateProgress(midpoint, 'ultra_mikro')).toBeCloseTo(50, 0)
    })

    it('should return 0 at minimum', () => {
      expect(calculateProgress(0, 'ultra_mikro')).toBe(0)
    })

    it('should return 100 at maximum', () => {
      expect(calculateProgress(THRESHOLDS.ultra_mikro.max, 'ultra_mikro')).toBeCloseTo(100, 0)
    })

    it('should return 100 for kecil level', () => {
      expect(calculateProgress(2_000_000_000, 'kecil')).toBe(100)
    })
  })

  describe('formatUMKMLevel', () => {
    it('should format all levels correctly', () => {
      expect(formatUMKMLevel('ultra_mikro')).toBe('Ultra Mikro')
      expect(formatUMKMLevel('super_mikro')).toBe('Super Mikro')
      expect(formatUMKMLevel('mikro')).toBe('Mikro')
      expect(formatUMKMLevel('kecil')).toBe('Kecil')
    })
  })
})
```

---

## Component Tests

### Example: StatCard Component

Create `src/tests/components/StatCard.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/dashboard/StatCard'
import { TrendingUp } from 'lucide-react'

describe('StatCard', () => {
  it('should render title and value correctly', () => {
    render(
      <StatCard
        title="Total Pemasukan"
        value="Rp 5.000.000"
        icon={TrendingUp}
        trend={{ value: 12, label: 'vs bulan lalu' }}
      />
    )

    expect(screen.getByText('Total Pemasukan')).toBeInTheDocument()
    expect(screen.getByText('Rp 5.000.000')).toBeInTheDocument()
  })

  it('should render positive trend correctly', () => {
    render(
      <StatCard
        title="Profit"
        value="Rp 1.000.000"
        icon={TrendingUp}
        trend={{ value: 15, label: 'naik' }}
      />
    )

    expect(screen.getByText('15%')).toBeInTheDocument()
    expect(screen.getByText('naik')).toBeInTheDocument()
  })

  it('should render negative trend correctly', () => {
    render(
      <StatCard
        title="Pengeluaran"
        value="Rp 2.000.000"
        icon={TrendingUp}
        trend={{ value: -10, label: 'turun' }}
      />
    )

    expect(screen.getByText('-10%')).toBeInTheDocument()
  })

  it('should render without trend', () => {
    render(
      <StatCard
        title="Transaksi"
        value="150"
        icon={TrendingUp}
      />
    )

    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })
})
```

---

## Integration Tests

### Example: Transaction Creation Flow

Create `src/tests/integration/transactionFlow.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { supabase } from '@/integrations/supabase/client'

describe('Transaction Creation Flow', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
  })

  it('should create income transaction successfully', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: {}, error: null })

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any)

    const user = userEvent.setup()

    render(
      <QueryClientProvider client={queryClient}>
        <TransactionForm />
      </QueryClientProvider>
    )

    // Fill form
    await user.type(screen.getByLabelText(/jumlah/i), '500000')
    await user.type(screen.getByLabelText(/kategori/i), 'Penjualan')
    await user.selectOptions(screen.getByLabelText(/tipe/i), 'income')

    // Submit
    await user.click(screen.getByRole('button', { name: /simpan/i }))

    // Verify API call
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 500000,
          category: 'Penjualan',
          type: 'income',
        })
      )
    })
  })

  it('should show validation error for negative amount', async () => {
    const user = userEvent.setup()

    render(
      <QueryClientProvider client={queryClient}>
        <TransactionForm />
      </QueryClientProvider>
    )

    await user.type(screen.getByLabelText(/jumlah/i), '-100')
    await user.click(screen.getByRole('button', { name: /simpan/i }))

    expect(await screen.findByText(/jumlah harus positif/i)).toBeInTheDocument()
  })
})
```

---

## E2E Tests

### Critical User Flows

1. **Complete Onboarding Flow**
   - Sign up → Profile setup → First transaction

2. **AI Strategy Generation**
   - Input data → Generate strategy → View results

3. **Excel Import**
   - Upload file → Map columns → Import → Verify transactions

4. **Monthly Report**
   - Filter by month → View charts → Export PDF

### Tools
- **Playwright** (recommended) or **Cypress**

```bash
npm install -D @playwright/test
npx playwright install
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Check coverage thresholds
        run: npm test -- --coverage --coverage.thresholds.lines=70

      - name: Build
        run: npm run build
```

---

## Test Data Management

### Mock Data Factory

Create `src/tests/mockData/transactions.ts`:

```typescript
import { Database } from '@/integrations/supabase/types'

type Transaction = Database['public']['Tables']['transactions']['Row']

export const createMockTransaction = (
  overrides?: Partial<Transaction>
): Transaction => ({
  id: crypto.randomUUID(),
  user_id: 'test-user-id',
  type: 'income',
  category: 'Penjualan',
  amount: 100000,
  description: 'Test transaction',
  transaction_date: new Date().toISOString(),
  source: 'pwa',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockTransactions = (count: number): Transaction[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockTransaction({
      id: `transaction-${i}`,
      amount: (i + 1) * 10000,
    })
  )
}
```

---

## Testing Best Practices

### DO ✅
- Test behavior, not implementation
- Use descriptive test names
- Keep tests independent and isolated
- Mock external dependencies (Supabase, APIs)
- Test edge cases (0, negative, null, infinity)
- Use `beforeEach` for setup
- Clean up after tests

### DON'T ❌
- Test library code (React, Supabase)
- Create interdependent tests
- Use real API calls in unit tests
- Hardcode dates (use relative dates)
- Skip flaky tests (fix them!)
- Test private functions directly
- Mock everything (integration tests need real components)

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific file
npm test -- calculations.test.ts

# Watch mode
npm test -- --watch

# UI mode
npm test -- --ui

# Run E2E tests
npm run test:e2e
```

---

## Coverage Goals

### Current State
- Estimated: < 10% coverage

### Phase 1 Target (Week 3)
- Overall: 70%
- Critical files: 100%
- Components: 60%
- Hooks: 70%

### Phase 2 Target (Month 3)
- Overall: 85%
- Critical files: 100%
- Components: 80%
- Hooks: 90%
- E2E: 5 critical flows

---

## Next Steps

1. ✅ Create `vitest.config.ts`
2. ✅ Create test setup file
3. ✅ Extract financial logic to `src/lib/calculations.ts`
4. ✅ Write 100% coverage for calculations
5. ✅ Extract UMKM logic to `src/lib/umkmClassification.ts`
6. ✅ Write 100% coverage for UMKM classification
7. Add component tests for UI components
8. Add integration tests for API calls
9. Set up CI/CD pipeline
10. Add E2E tests for critical flows

---

**Status:** Ready for implementation
**Owner:** Development Team
**Review Date:** Weekly during Phase 1
