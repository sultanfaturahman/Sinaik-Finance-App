import {
  StrategyFormState,
  StrategyInputs,
  StrategyItem,
  StrategyPlan,
  StrategyStep,
} from "@/types/strategy";

const toString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value as T];
};

const asOptionalString = (value: unknown): string | undefined => {
  const str = toString(value).trim();
  return str.length > 0 ? str : undefined;
};

const normaliseItem = (item: unknown, index: number): StrategyItem => {
  const record = (item as Record<string, unknown>) ?? {};
  return {
    id: asOptionalString(record.id) ?? `item-${index + 1}`,
    title: asOptionalString(record.title) ?? `Strategi ${index + 1}`,
    description: toString(record.description),
    expected_impact: asOptionalString(record.expected_impact),
    expected_savings: asOptionalString(record.expected_savings),
  };
};

const normaliseStep = (step: unknown, index: number): StrategyStep => {
  const record = (step as Record<string, unknown>) ?? {};
  const safeId = asOptionalString(record.id) ?? `week-${index + 1}`;
  const tasks = ensureArray<Record<string, unknown>>(record.tasks).map((task, taskIndex) => ({
    id: asOptionalString(task.id) ?? `${safeId}-task-${taskIndex + 1}`,
    title: asOptionalString(task.title) ?? `Tugas ${taskIndex + 1}`,
    owner: asOptionalString(task.owner),
    metric: asOptionalString(task.metric),
  }));

  return {
    id: safeId,
    title: asOptionalString(record.title) ?? `Minggu ${index + 1}`,
    timeframe: asOptionalString(record.timeframe) ?? `Minggu ${index + 1}`,
    summary: toString(record.summary),
    tasks,
  };
};

const normaliseTask = (task: unknown, prefix: string, index: number): StrategyTask => {
  const record = (task as Record<string, unknown>) ?? {};
  return {
    id: asOptionalString(record.id) ?? `${prefix}-${index + 1}`,
    title: asOptionalString(record.title) ?? `Tugas ${index + 1}`,
    owner: asOptionalString(record.owner),
    metric: asOptionalString(record.metric),
    timeframe: asOptionalString(record.timeframe),
  };
};

export const normalizeStrategyPlan = (raw: unknown): StrategyPlan => {
  const payload = (raw as Record<string, unknown>) ?? {};
  const analysis =
    (payload.analysis as Record<string, unknown>) ??
    (typeof payload.analysisSummary === "string"
      ? { summary: payload.analysisSummary }
      : {});

  const keyFocus = ensureArray(
    payload.key_focus ?? payload.keyFocus ?? payload.focusAreas ?? [],
  )
    .map((item) => toString(item).trim())
    .filter(Boolean);

  const actionsRaw = payload.actions ?? payload.actionItems ?? payload.action_list;
  const flatActions = ensureArray(actionsRaw).map((task, index) =>
    normaliseTask(task, "action", index),
  );

  const revenueRaw =
    payload.revenue_strategies ??
    payload.revenueStrategies ??
    payload.revenue_plan ??
    payload.revenue;

  const costRaw =
    payload.cost_strategies ??
    payload.costStrategies ??
    payload.cost_plan ??
    payload.efficiency;

  const actionPlanRaw = payload.action_plan ?? payload.actionPlan ?? payload.weekly_plan;
  const targetsRaw = payload.targets ?? payload.milestones ?? payload.goals;

  const strategy: StrategyPlan = {
    analysis: {
      summary:
        toString(analysis.summary) ||
        "AI berhasil menghasilkan strategi, namun ringkasan tidak tersedia.",
      key_metrics: ensureArray<Record<string, unknown>>(
        analysis.key_metrics ?? analysis.keyMetrics ?? payload.key_metrics ?? [],
      ).map(
        (metric, index) => ({
          label: toString(metric.label, `Metric ${index + 1}`),
          value: toString(metric.value, "-"),
        }),
      ),
    },
    revenue_strategies: ensureArray(revenueRaw).map((entry, index) => {
      const item = normaliseItem(entry, index);
      if (item.id === `item-${index + 1}`) {
        item.id = `rev-${index + 1}`;
      }
      return item;
    }),
    cost_strategies: ensureArray(costRaw).map((entry, index) => {
      const item = normaliseItem(entry, index);
      if (item.id === `item-${index + 1}`) {
        item.id = `cost-${index + 1}`;
      }
      return item;
    }),
    action_plan: ensureArray(actionPlanRaw).map(normaliseStep),
    targets: ensureArray<Record<string, unknown>>(targetsRaw).map((target, index) => ({
      label: asOptionalString(target.label) ?? `Target ${index + 1}`,
      value: asOptionalString(target.value) ?? '-',
    })),
    key_focus: keyFocus.length > 0 ? keyFocus : undefined,
    actions: flatActions.length > 0 ? flatActions : undefined,
    timeframe: asOptionalString(payload.timeframe ?? payload.timeFrame),
    version: asOptionalString(payload.version ?? payload.strategyVersion),
  };

  if (!strategy.revenue_strategies.length) {
    const focusSources =
      strategy.key_focus && strategy.key_focus.length > 0
        ? strategy.key_focus
        : ["Perkuat promosi", "Optimalkan kanal digital", "Bangun kemitraan lokal"];
    strategy.revenue_strategies = focusSources.slice(0, 3).map((focus, index) => ({
      id: `rev-fallback-${index + 1}`,
      title: focus,
      description: `Prioritaskan inisiatif "${focus}" dalam 7 hari ke depan.`,
      expected_impact: "Perkirakan dampak finansial dan ukur realisasinya.",
    }));
  }

  if (!strategy.cost_strategies.length) {
    strategy.cost_strategies = [
      {
        id: "cost-fallback-1",
        title: "Evaluasi biaya operasional",
        description: "Tinjau pos biaya rutin dan cari peluang efisiensi 5-10%.",
        expected_savings: "Catat target penghematan realistis dan pantau capaian.",
      },
      {
        id: "cost-fallback-2",
        title: "Negosiasi supplier utama",
        description: "Bahas ulang harga dan syarat pembayaran dengan pemasok inti.",
        expected_savings: "Minimal 3% penghematan dari total pembelian bulanan.",
      },
      {
        id: "cost-fallback-3",
        title: "Optimalkan jadwal tenaga kerja",
        description: "Sesuaikan shift/tugas agar produktivitas meningkat tanpa overtime.",
        expected_savings: "Sasar penghematan jam lembur hingga 20%.",
      },
    ];
  }

  if (!strategy.action_plan.length) {
    const tasks = strategy.actions && strategy.actions.length > 0 ? strategy.actions : [];
    const grouped = [0, 1, 2, 3].map((week) => ({
      id: `week-${week + 1}`,
      title: `Minggu ${week + 1}`,
      timeframe: `Minggu ${week + 1}`,
      summary: "Rangkaian tugas prioritas minggu ini.",
      tasks: tasks
        .slice(week * 3, week * 3 + 3)
        .map((task, index) => normaliseTask(task, `week-${week + 1}-task`, index)),
    }));
    strategy.action_plan = grouped;
  }

  if (!strategy.targets.length) {
    strategy.targets = [
      {
        label: "Prioritas Berikutnya",
        value: "Tinjau ulang strategi dan tetapkan target finansial realistis 90 hari.",
      },
    ];
  }

  if (!strategy.analysis.key_metrics.length) {
    strategy.analysis.key_metrics = [
      { label: "Status Strategi", value: "Perlu data tambahan untuk rekomendasi detail." },
    ];
  }

  return strategy;
};

export const createDefaultStrategyFormState = (): StrategyFormState => ({
  profile: {
    businessName: "",
    sector: "",
    targetMarket: "",
    teamSize: "",
    differentiator: "",
  },
  financialSummary: {
    revenueYtd: "",
    expenseYtd: "",
    netProfitYtd: "",
    profitMargin: "",
    noteworthyTrend: "",
  },
  goals: {
    primary: "",
    secondary: "",
    timeframe: "",
    risks: "",
  },
});

export const transformFormStateToPayload = (form: StrategyFormState): StrategyInputs => ({
  profile: {
    businessName: form.profile.businessName.trim(),
    sector: form.profile.sector.trim(),
    targetMarket: form.profile.targetMarket.trim(),
    teamSize: form.profile.teamSize.trim(),
    differentiator: form.profile.differentiator.trim(),
  },
  financialSummary: {
    revenueYtd: toNumber(form.financialSummary.revenueYtd),
    expenseYtd: toNumber(form.financialSummary.expenseYtd),
    netProfitYtd: toNumber(form.financialSummary.netProfitYtd),
    profitMargin: Number.parseFloat(form.financialSummary.profitMargin) || 0,
    noteworthyTrend: form.financialSummary.noteworthyTrend.trim(),
  },
  goals: {
    primary: form.goals.primary.trim(),
    secondary: form.goals.secondary.trim(),
    timeframe: form.goals.timeframe.trim(),
    risks: form.goals.risks.trim(),
  },
});
