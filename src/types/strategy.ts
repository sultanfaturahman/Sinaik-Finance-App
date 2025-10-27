export interface StrategyMetric {
  label: string;
  value: string;
}

export interface StrategyItem {
  id: string;
  title: string;
  description: string;
  expected_impact?: string;
  expected_savings?: string;
}

export interface StrategyTask {
  id: string;
  title: string;
  owner?: string;
  metric?: string;
  timeframe?: string;
}

export interface StrategyStep {
  id: string;
  title: string;
  timeframe: string;
  summary: string;
  tasks: StrategyTask[];
}

export interface StrategyPlan {
  analysis: {
    summary: string;
    key_metrics: StrategyMetric[];
  };
  revenue_strategies: StrategyItem[];
  cost_strategies: StrategyItem[];
  action_plan: StrategyStep[];
  targets: Array<{ label: string; value: string }>;
  key_focus?: string[];
  actions?: StrategyTask[];
  timeframe?: string;
  version?: string;
}

export interface StrategyProfileInput {
  businessName: string;
  sector: string;
  targetMarket: string;
  teamSize: string;
  differentiator: string;
}

export interface StrategyFinancialSummaryInput {
  revenueYtd: number;
  expenseYtd: number;
  netProfitYtd: number;
  profitMargin: number;
  noteworthyTrend: string;
}

export interface StrategyGoalInput {
  primary: string;
  secondary: string;
  timeframe: string;
  risks: string;
}

export interface StrategyInputs {
  profile: StrategyProfileInput;
  financialSummary: StrategyFinancialSummaryInput;
  goals: StrategyGoalInput;
}

export interface StrategyFormState {
  profile: {
    businessName: string;
    sector: string;
    targetMarket: string;
    teamSize: string;
    differentiator: string;
  };
  financialSummary: {
    revenueYtd: string;
    expenseYtd: string;
    netProfitYtd: string;
    profitMargin: string;
    noteworthyTrend: string;
  };
  goals: {
    primary: string;
    secondary: string;
    timeframe: string;
    risks: string;
  };
}

export interface StrategyFinancialSnapshot {
  umkmLevel: string;
  annualRevenue: number;
  yearToDate: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    profitMargin: number;
    transactionCount: number;
  };
  topIncomeCategories: Array<{ category: string; amount: number; percentage: string }>;
  topExpenseCategories: Array<{ category: string; amount: number; percentage: string }>;
  monthlyTrends: Array<{ month: string; income: number; expense: number; profit: number }>;
}

export interface StrategyRunResponse {
  runId: string;
  strategy: StrategyPlan;
  profile: StrategyProfileInput;
  financialSummary: StrategyFinancialSummaryInput;
  goals: StrategyGoalInput;
  cacheHit: boolean;
  rawStrategy?: string | null;
  model?: string | null;
  createdAt?: string;
}
