import { Suspense, lazy, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/app/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
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

const Dashboard = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const { onboardingCompleted, ready: onboardingReady } = useCategorySuggestions();
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
        <div data-testid="stats-grid" className="flex flex-col gap-4">
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
      )}
    </AppShell>
  );
};

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <Skeleton key={index} className="h-24 rounded-xl" />
    ))}
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
