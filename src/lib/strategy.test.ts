import { describe, expect, it } from 'vitest';
import {
  createDefaultStrategyFormState,
  normalizeStrategyPlan,
  transformFormStateToPayload,
} from './strategy';

describe('strategy helpers', () => {
  it('normalizes raw strategy payload with fallbacks', () => {
    const normalized = normalizeStrategyPlan({
      analysis: {
        summary: 'Ringkasan awal',
        key_metrics: [{ label: 'Margin', value: '25%' }],
      },
      revenue_strategies: [
        { id: '', title: '', description: 'Tambah promo', expected_impact: 'Rp 5.000.000' },
      ],
      cost_strategies: [
        { description: 'Negosiasi supplier', expected_savings: 'Rp 2.000.000' },
      ],
      action_plan: [
        {
          id: '',
          title: '',
          timeframe: '',
          summary: '',
          tasks: [{ id: '', title: 'Hubungi 5 pelanggan', owner: 'Tim Sales', metric: 'Jumlah follow-up' }],
        },
      ],
      targets: [{ label: '', value: '' }],
      key_focus: ['Fokus utama', 'Kembangkan produk'],
      actions: [{ id: '', title: 'Audit biaya', owner: 'Founder', metric: 'Selesai', timeframe: 'Minggu 1' }],
      timeframe: '30 hari',
      version: 'v1',
    });

    expect(normalized.analysis.summary).toBe('Ringkasan awal');
    expect(normalized.analysis.key_metrics[0]).toEqual({ label: 'Margin', value: '25%' });
    expect(normalized.revenue_strategies[0].id).toBe('rev-1');
    expect(normalized.cost_strategies[0].id).toBe('cost-1');
    expect(normalized.action_plan[0].id).toBe('week-1');
    expect(normalized.action_plan[0].tasks[0].id).toBe('week-1-task-1');
    expect(normalized.targets[0]).toEqual({ label: 'Target 1', value: '-' });
    expect(normalized.key_focus).toEqual(['Fokus utama', 'Kembangkan produk']);
    expect(normalized.actions?.[0]).toMatchObject({ id: 'action-1', timeframe: 'Minggu 1' });
    expect(normalized.timeframe).toBe('30 hari');
    expect(normalized.version).toBe('v1');
  });

  it('transforms form state to numeric payload', () => {
    const formState = createDefaultStrategyFormState();
    formState.profile.businessName = 'Warung SiNaik';
    formState.financialSummary.revenueYtd = '150000000';
    formState.financialSummary.expenseYtd = '80000000';
    formState.financialSummary.netProfitYtd = '70000000';
    formState.financialSummary.profitMargin = '28.5';
    formState.goals.primary = 'Naikkan omzet 25%';

    const payload = transformFormStateToPayload(formState);

    expect(payload.profile.businessName).toBe('Warung SiNaik');
    expect(payload.financialSummary.revenueYtd).toBe(150000000);
    expect(payload.financialSummary.expenseYtd).toBe(80000000);
    expect(payload.financialSummary.netProfitYtd).toBe(70000000);
    expect(payload.financialSummary.profitMargin).toBeCloseTo(28.5);
    expect(payload.goals.primary).toBe('Naikkan omzet 25%');
  });

  it('normalizes camelCase strategy payloads', () => {
    const normalized = normalizeStrategyPlan({
      analysisSummary: 'Analisis singkat',
      keyMetrics: [{ label: 'Growth', value: '10%' }],
      revenueStrategies: { id: '', title: 'Strategi A', description: 'Desc', expectedImpact: 'Rp 1M' },
      costStrategies: [
        { id: 'eff', title: 'Hemat', description: 'Desc', expectedSavings: 'Rp 500k' },
      ],
      actionPlan: [
        {
          id: 'wk-1',
          title: 'Week 1',
          timeframe: 'Week 1',
          summary: 'Summary',
          tasks: [{ title: 'Task A', owner: 'Owner', metric: 'Metric', timeframe: 'Week 1' }],
        },
      ],
      milestones: [{ label: 'Milestone', value: 'Value' }],
      keyFocus: ['Focus A'],
      actions: [{ title: 'Action Task', owner: 'Owner', metric: 'Metric', timeframe: 'Week 2' }],
      timeFrame: 'Q1',
      strategyVersion: '2025.1',
    });

    expect(normalized.analysis.summary).toBe('Analisis singkat');
    expect(normalized.revenue_strategies[0].id).toBe('rev-1');
    expect(normalized.cost_strategies[0].id).toBe('eff');
    expect(normalized.targets[0]).toEqual({ label: 'Milestone', value: 'Value' });
    expect(normalized.key_focus).toEqual(['Focus A']);
    expect(normalized.actions?.[0].timeframe).toBe('Week 2');
    expect(normalized.timeframe).toBe('Q1');
    expect(normalized.version).toBe('2025.1');
  });
});
