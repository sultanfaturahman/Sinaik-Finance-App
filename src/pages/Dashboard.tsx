import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialSnapshot } from "@/hooks/useFinancialSnapshot";
import { AppShell } from "@/app/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCategorySuggestions } from "@/hooks/useCategorySuggestions";
import { Skeleton } from "@/components/ui/skeleton";
const OnboardingWizard = lazy(() => import("@/components/OnboardingWizard"));

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  transactionCount: number;
}

interface DashboardStatsRow {
  total_income: number | null;
  total_expense: number | null;
  net_profit: number | null;
  transaction_count: number | null;
}

const trendChartConfig = {
  income: { label: "Pemasukan", color: "hsl(142, 71%, 45%)" },
  expense: { label: "Pengeluaran", color: "hsl(0, 84%, 60%)" },
  profit: { label: "Laba Bersih", color: "hsl(221, 83%, 53%)" },
} satisfies ChartConfig;

const CATEGORY_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(343, 80%, 54%)",
];

const shortMonth = (label: string) => {
  const parts = label.split(" ");
  return parts[0]?.slice(0, 3) ?? label;
};

const compactRupiah = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
};

const Dashboard = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const { onboardingCompleted, ready: onboardingReady } = useCategorySuggestions();
  const { snapshot, loading: snapshotLoading } = useFinancialSnapshot();
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchStats = async () => {
      if (!userId || !active) return;

      setLoading(true);

      try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase.rpc("get_dashboard_stats");

        if (error) {
          throw error;
        }

        const statsRow: DashboardStatsRow | undefined = Array.isArray(data)
          ? data[0]
          : (data as DashboardStatsRow | null) ?? undefined;

        if (!active) return;

        setStats({
          totalIncome: Number(statsRow?.total_income ?? 0),
          totalExpense: Number(statsRow?.total_expense ?? 0),
          netProfit: Number(statsRow?.net_profit ?? 0),
          transactionCount: Number(statsRow?.transaction_count ?? 0),
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchStats();

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!onboardingReady) return;
    setShowOnboarding(!onboardingCompleted);
  }, [onboardingCompleted, onboardingReady]);

  const categoryChartConfig = useMemo(() => {
    if (!snapshot) return {} as ChartConfig;
    const cats = snapshot.topIncomeCategories;
    const config: ChartConfig = {};
    cats.forEach((c, i) => {
      config[c.category] = {
        label: c.category,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      };
    });
    return config;
  }, [snapshot]);

  const categoryBarData = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.topIncomeCategories.map((c, i) => ({
      name: c.category,
      amount: c.amount,
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [snapshot]);

  const hasChartData =
    snapshot &&
    snapshot.monthlyTrends.some((m) => m.income > 0 || m.expense > 0);

  type StatVariant = "default" | "positive" | "negative" | "purple" | "orange" | "pink";
  const statCards: Array<{
    title: string;
    value: ReactNode;
    icon?: ReactNode;
    helper?: string;
    variant?: StatVariant;
  }> = [
    {
      title: "Total Pemasukan",
      value: formatCurrency(stats.totalIncome),
      icon: <TrendingUp className="h-5 w-5" />,
      variant: "positive" as const,
      helper: "Akumulasi sejak awal tahun",
    },
    {
      title: "Total Pengeluaran",
      value: formatCurrency(stats.totalExpense),
      icon: <TrendingDown className="h-5 w-5" />,
      variant: "orange" as const,
      helper: "Termasuk biaya operasional dan tetap",
    },
    {
      title: "Laba Bersih",
      value: formatCurrency(stats.netProfit),
      icon: <Wallet className="h-5 w-5" />,
      variant: stats.netProfit >= 0 ? ("positive" as StatVariant) : ("negative" as StatVariant),
      helper: stats.netProfit >= 0 ? "Kondisi kas sehat" : "Perlu evaluasi pengeluaran",
    },
    {
      title: "Total Transaksi",
      value: stats.transactionCount.toLocaleString("id-ID"),
      icon: <Receipt className="h-5 w-5" />,
      variant: "purple" as const,
      helper: "Jumlah transaksi tercatat",
    },
  ];

  return (
    <AppShell title="Dashboard" subtitle="Ringkasan terkini performa usaha Anda">
      {showOnboarding && (
        <Suspense fallback={<OnboardingWizardFallback />}>
          <OnboardingWizard
            open={showOnboarding}
            onOpenChange={setShowOnboarding}
            onCompleted={() => setShowOnboarding(false)}
          />
        </Suspense>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stat Cards - 2 kolom di mobile, 4 kolom di desktop */}
          <div data-testid="stats-grid" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
                helper={card.helper}
                variant={card.variant}
              />
            ))}
          </div>

          {/* Charts */}
          {snapshotLoading ? (
            <div className="grid gap-6 lg:grid-cols-5">
              <Skeleton className="h-80 rounded-xl lg:col-span-3" />
              <Skeleton className="h-80 rounded-xl lg:col-span-2" />
            </div>
          ) : hasChartData ? (
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Trend Chart - lebar */}
              <Card className="rounded-xl border border-border/50 shadow-sm lg:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Tren Keuangan</CardTitle>
                  <CardDescription>Pemasukan, pengeluaran & laba 6 bulan terakhir</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ChartContainer config={trendChartConfig} className="aspect-[4/3] w-full sm:aspect-[16/9]">
                    <AreaChart
                      data={snapshot!.monthlyTrends}
                      margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickFormatter={shortMonth}
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                      />
                      <YAxis
                        tickFormatter={compactRupiah}
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        width={48}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(label) => String(label)}
                            formatter={(value) => formatCurrency(Number(value))}
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area
                        dataKey="income"
                        type="monotone"
                        stroke="var(--color-income)"
                        fill="url(#fillIncome)"
                        strokeWidth={2}
                      />
                      <Area
                        dataKey="expense"
                        type="monotone"
                        stroke="var(--color-expense)"
                        fill="url(#fillExpense)"
                        strokeWidth={2}
                      />
                      <Area
                        dataKey="profit"
                        type="monotone"
                        stroke="var(--color-profit)"
                        fill="none"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Top Categories - sempit di samping */}
              {categoryBarData.length > 0 && (
                <Card className="rounded-xl border border-border/50 shadow-sm lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Top Kategori Pemasukan</CardTitle>
                    <CardDescription>5 kategori terbesar</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ChartContainer config={categoryChartConfig} className="aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[4/3]">
                      <BarChart
                        data={categoryBarData}
                        layout="vertical"
                        margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          width={80}
                          fontSize={11}
                          tickFormatter={(v: string) =>
                            v.length > 12 ? `${v.slice(0, 12)}..` : v
                          }
                        />
                        <XAxis
                          type="number"
                          tickFormatter={compactRupiah}
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          }
                        />
                        <Bar dataKey="amount" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      )}
    </AppShell>
  );
};

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-28 rounded-xl" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-5">
      <Skeleton className="h-80 rounded-xl lg:col-span-3" />
      <Skeleton className="h-80 rounded-xl lg:col-span-2" />
    </div>
  </div>
);

const OnboardingWizardFallback = () => (
  <div className="rounded-xl border border-dashed border-border/50 bg-background p-6">
    <div className="mb-4 space-y-2">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={`wizard-skeleton-${index}`} className="h-20 rounded-xl" />
      ))}
    </div>
  </div>
);

export default Dashboard;
